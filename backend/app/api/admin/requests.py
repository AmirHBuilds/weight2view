import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.admin import AdminAuth
from app.database import get_db
from app.models.item_request import ItemRequest
from app.schemas.item_request import ItemRequestRead, ItemRequestUpdate

router = APIRouter(prefix="/admin/requests", tags=["admin:requests"], dependencies=[AdminAuth])


@router.get("", response_model=list[ItemRequestRead])
def list_requests(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(ItemRequest)
    if status:
        query = query.filter(ItemRequest.status == status)
    return query.order_by(ItemRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=ItemRequestRead)
def get_request(request_id: uuid.UUID, db: Session = Depends(get_db)):
    req = db.query(ItemRequest).filter(ItemRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.patch("/{request_id}", response_model=ItemRequestRead)
def update_request(request_id: uuid.UUID, payload: ItemRequestUpdate, db: Session = Depends(get_db)):
    req = db.query(ItemRequest).filter(ItemRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(req, key, value)
    db.commit()
    db.refresh(req)
    return req
