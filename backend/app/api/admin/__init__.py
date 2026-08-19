"""
Admin API package.

TODO(auth): `require_admin` below is a placeholder. It currently allows
every request through in development mode. Before deploying anywhere
non-local:
  1. Replace this with a real dependency (session cookie, JWT, or SSO check).
  2. Raise HTTPException(401/403) when the caller isn't an authenticated admin.
  3. Apply it to every router in this package via `dependencies=[Depends(require_admin)]`
     (already wired up below - only this function's body needs to change).
  4. Ensure `admin_dev_mode` is forced False outside of `environment=="development"`.
"""
from fastapi import Depends, HTTPException

from app.config import get_settings


def require_admin() -> None:
    settings = get_settings()
    if settings.environment != "development" and not settings.admin_dev_mode:
        # Placeholder for real auth failure - replace entirely once real
        # authentication exists. Today this only blocks accidental
        # non-development deployment with dev mode off.
        raise HTTPException(status_code=403, detail="Admin authentication not configured")
    return None


AdminAuth = Depends(require_admin)
