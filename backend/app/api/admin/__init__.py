"""
Admin API package - authentication/authorization dependencies.

Replaces the earlier dev-only stub (see project history) with real,
backend-enforced session authentication. Every admin route depends on
`AdminAuth` (or `SuperAdminAuth`) via FastAPI's `Depends`, which means
authorization is checked on every single request regardless of what the
frontend does or doesn't render - knowing an admin URL is never enough on
its own to reach admin data.

Session model: an opaque random token lives in an HttpOnly cookie; the
actual session record (who, expiry) lives server-side in `admin_sessions`.
Deleting that row (logout, or an admin manually being deactivated) revokes
access immediately - no JWT-blocklist or waiting-out-an-expiry required.
"""
from fastapi import Cookie, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.admin_user import AdminUser
from app.services.auth import get_session_by_token

_settings = get_settings()


def get_current_admin(
    db: Session = Depends(get_db),
    token: str | None = Cookie(default=None, alias=_settings.session_cookie_name),
) -> AdminUser:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = get_session_by_token(db, token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    admin = session.admin_user
    if not admin.is_active:
        raise HTTPException(status_code=401, detail="Account is deactivated")
    return admin


def require_super_admin(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    if admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return admin


AdminAuth = Depends(get_current_admin)
SuperAdminAuth = Depends(require_super_admin)


def set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.effective_session_cookie_secure,
        samesite="lax",
        max_age=settings.session_lifetime_hours * 3600,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(key=settings.session_cookie_name, path="/")
