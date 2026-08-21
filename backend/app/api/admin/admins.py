import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.admin import SuperAdminAuth
from app.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.auth import AdminPasswordReset, AdminUserCreate, AdminUserRead, AdminUserUpdate
from app.services.auth import hash_password

router = APIRouter(prefix="/admin/admins", tags=["admin:admins"], dependencies=[SuperAdminAuth])


def _count_active_super_admins(db: Session, excluding_id: uuid.UUID | None = None) -> int:
    query = db.query(AdminUser).filter(AdminUser.role == "super_admin", AdminUser.is_active.is_(True))
    if excluding_id:
        query = query.filter(AdminUser.id != excluding_id)
    return query.count()


@router.get("", response_model=list[AdminUserRead])
def list_admins(db: Session = Depends(get_db)):
    return db.query(AdminUser).order_by(AdminUser.created_at).all()


@router.post("", response_model=AdminUserRead, status_code=201)
def create_admin(payload: AdminUserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.query(AdminUser).filter(AdminUser.email == email).first():
        raise HTTPException(status_code=409, detail="An admin with this email already exists")

    admin = AdminUser(
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.patch("/{admin_id}", response_model=AdminUserRead)
def update_admin(
    admin_id: uuid.UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current: AdminUser = SuperAdminAuth,
):
    target = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")

    # Guard: never let the last active super admin be demoted or
    # deactivated - including by themselves - or every admin route becomes
    # permanently inaccessible with no way back in.
    would_demote = payload.role is not None and payload.role != "super_admin" and target.role == "super_admin"
    would_deactivate = payload.is_active is False and target.is_active

    if (would_demote or would_deactivate) and target.role == "super_admin":
        if _count_active_super_admins(db, excluding_id=target.id) == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the last active super admin",
            )

    if target.id == current.id and (would_demote or would_deactivate):
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role or deactivate your own account",
        )

    if payload.role is not None:
        target.role = payload.role
    if payload.is_active is not None:
        target.is_active = payload.is_active

    db.commit()
    db.refresh(target)
    return target


@router.post("/{admin_id}/reset-password", response_model=AdminUserRead)
def reset_password(admin_id: uuid.UUID, payload: AdminPasswordReset, db: Session = Depends(get_db)):
    target = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    target.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(target)
    return target
