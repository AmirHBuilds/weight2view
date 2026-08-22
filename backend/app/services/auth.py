"""
Authentication service: password hashing/verification and session
lifecycle. Deliberately framework-free (no FastAPI imports) so it's usable
from the startup bootstrap hook, admin-management endpoints, and tests
without pulling in request/response concerns.
"""
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.admin_user import AdminSession, AdminUser

SESSION_TOKEN_BYTES = 32  # 256 bits of entropy, URL-safe encoded


@dataclass(frozen=True)
class BootstrapResult:
    """
    Outcome of bootstrap_super_admin(), for the caller (the startup hook in
    app/main.py, or tests) to log/assert on without re-deriving why nothing
    happened.

    status is one of:
        "created"                    - a new super admin was created
        "existing"                   - the configured email already existed; untouched
        "skipped_no_credentials"     - neither ADMIN_EMAIL nor ADMIN_PASSWORD set
        "skipped_partial_credentials"- only one of the two set
        "skipped_already_exists"     - a different super admin already exists
    """

    status: str
    admin: AdminUser | None = None


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


def bootstrap_super_admin(db: Session) -> "BootstrapResult":
    """
    Ensures the bootstrap Super Admin exists, using ADMIN_EMAIL /
    ADMIN_PASSWORD strictly as *initial* credentials - not as an ongoing
    source of truth. Safe to call on every startup. Specifically:

    - No credentials configured -> does nothing. There is NO fallback
      account and NO default credentials; an app with no ADMIN_EMAIL/
      ADMIN_PASSWORD simply starts with zero admin users until one is
      created some other way (direct DB insert, or via an existing super
      admin once one exists).
    - Only one of the two configured -> does nothing (a partial
      configuration is treated as "not configured", not "use blank / a
      default for the missing half").
    - An account with the configured email already exists -> returned
      as-is. Its password is NEVER touched here, so an admin who changed
      their password through the Admin Panel keeps that password across
      restarts even if ADMIN_PASSWORD in .env is unchanged (or is now
      stale/different).
    - No account with that email, but a super admin already exists under
      a *different* email -> does nothing. Changing ADMIN_EMAIL after the
      fact must never silently mint a second privileged account; account
      management from that point on happens through the Admin Panel.
    - No account with that email, and no super admin exists at all -> the
      one case that actually creates an account.
    """
    settings = get_settings()
    email = (settings.admin_email or "").strip()
    password = settings.admin_password or ""

    if not email and not password:
        return BootstrapResult(status="skipped_no_credentials")
    if not email or not password:
        return BootstrapResult(status="skipped_partial_credentials")

    email = email.lower()
    existing_by_email = db.query(AdminUser).filter(AdminUser.email == email).first()
    if existing_by_email:
        return BootstrapResult(status="existing", admin=existing_by_email)

    any_super_admin = db.query(AdminUser).filter(AdminUser.role == "super_admin").first()
    if any_super_admin:
        return BootstrapResult(status="skipped_already_exists")

    user = AdminUser(
        email=email,
        password_hash=hash_password(password),
        role="super_admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return BootstrapResult(status="created", admin=user)
