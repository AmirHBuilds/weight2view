"""
Authentication service: password hashing/verification and session
lifecycle. Deliberately framework-free (no FastAPI imports) so it's usable
from the startup bootstrap hook, admin-management endpoints, and tests
without pulling in request/response concerns.
"""
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.admin_user import AdminSession, AdminUser

SESSION_TOKEN_BYTES = 32  # 256 bits of entropy, URL-safe encoded


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # Malformed hash - never crash the login flow over it, just fail closed.
        return False


def authenticate(db: Session, email: str, password: str) -> AdminUser | None:
    """Returns the AdminUser if credentials are valid and the account is active, else None."""
    user = db.query(AdminUser).filter(AdminUser.email == email.lower().strip()).first()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_session(db: Session, admin_user: AdminUser) -> AdminSession:
    settings = get_settings()
    token = secrets.token_urlsafe(SESSION_TOKEN_BYTES)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.session_lifetime_hours)
    session = AdminSession(admin_user_id=admin_user.id, token=token, expires_at=expires_at)
    db.add(session)

    admin_user.last_login_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)
    return session


def get_session_by_token(db: Session, token: str) -> AdminSession | None:
    session = db.query(AdminSession).filter(AdminSession.token == token).first()
    if not session:
        return None
    if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        # Expired - clean it up while we're here rather than leaving it to accumulate.
        db.delete(session)
        db.commit()
        return None
    return session


def delete_session_by_token(db: Session, token: str) -> None:
    db.query(AdminSession).filter(AdminSession.token == token).delete()
    db.commit()


def bootstrap_super_admin(db: Session) -> AdminUser | None:
    """
    Idempotently ensures the bootstrap Super Admin (from ADMIN_EMAIL /
    ADMIN_PASSWORD) exists. Safe to call on every startup: does nothing if
    an account with that email already exists, so re-running the app never
    creates duplicates or resets a since-changed password.
    """
    settings = get_settings()
    if not settings.admin_email or not settings.admin_password:
        return None

    email = settings.admin_email.lower().strip()
    existing = db.query(AdminUser).filter(AdminUser.email == email).first()
    if existing:
        return existing

    user = AdminUser(
        email=email,
        password_hash=hash_password(settings.admin_password),
        role="super_admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
