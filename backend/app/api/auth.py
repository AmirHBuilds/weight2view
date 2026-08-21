from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.api.admin import AdminAuth, clear_session_cookie, set_session_cookie
from app.config import get_settings
from app.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.auth import AdminUserRead, LoginRequest
from app.services.auth import authenticate, create_session, delete_session_by_token

router = APIRouter(prefix="/admin/auth", tags=["admin:auth"])


@router.post("/login", response_model=AdminUserRead)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    admin = authenticate(db, payload.email, payload.password)
    if not admin:
        # Deliberately identical error for "no such account" and "wrong
        # password" - don't leak which one it was.
        raise HTTPException(status_code=401, detail="Invalid email or password")
    session = create_session(db, admin)
    set_session_cookie(response, session.token)
    return admin


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    # Reads the raw cookie directly rather than depending on AdminAuth:
    # logout should succeed (and clear the cookie) even if the session was
    # already invalid/expired, rather than 401ing on the way out.
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        delete_session_by_token(db, token)
    clear_session_cookie(response)


@router.get("/me", response_model=AdminUserRead)
def me(admin: AdminUser = AdminAuth):
    return admin
