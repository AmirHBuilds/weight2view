import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.admin import AdminAuth
from app.database import get_db
from app.models.reference_object import ReferenceObject
from app.schemas.reference_object import ReferenceObjectRead, ReferenceObjectWrite

router = APIRouter(prefix="/admin/references", tags=["admin:references"], dependencies=[AdminAuth])


def _volume_from_dims(length_mm: float, width_mm: float, height_mm: float) -> float:
    return (length_mm * width_mm * height_mm) / 1_000_000  # mm3 -> L


@router.get("", response_model=list[ReferenceObjectRead])
def list_references(include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(ReferenceObject)
    if not include_inactive:
        query = query.filter(ReferenceObject.active.is_(True))
    return query.order_by(ReferenceObject.volume_l).all()


@router.post("", response_model=ReferenceObjectRead, status_code=201)
def create_reference(payload: ReferenceObjectWrite, db: Session = Depends(get_db)):
    volume_l = _volume_from_dims(payload.length_mm, payload.width_mm, payload.height_mm)
    ref = ReferenceObject(volume_l=volume_l, **payload.model_dump())
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


@router.patch("/{ref_id}", response_model=ReferenceObjectRead)
def update_reference(ref_id: uuid.UUID, payload: ReferenceObjectWrite, db: Session = Depends(get_db)):
    ref = db.query(ReferenceObject).filter(ReferenceObject.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference object not found")
    for key, value in payload.model_dump().items():
        setattr(ref, key, value)
    ref.volume_l = _volume_from_dims(payload.length_mm, payload.width_mm, payload.height_mm)
    db.commit()
    db.refresh(ref)
    return ref


@router.post("/{ref_id}/deactivate", response_model=ReferenceObjectRead)
def deactivate_reference(ref_id: uuid.UUID, db: Session = Depends(get_db)):
    ref = db.query(ReferenceObject).filter(ReferenceObject.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference object not found")
    ref.active = False
    db.commit()
    db.refresh(ref)
    return ref
