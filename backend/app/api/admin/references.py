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
def list_references(
    q: str | None = None,
    category: str | None = None,
    status: str = "all",  # active | inactive | all
    sort: str = "name",  # name | status
    db: Session = Depends(get_db),
):
    query = db.query(ReferenceObject)
    if q:
        query = query.filter(ReferenceObject.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(ReferenceObject.category == category)
    if status == "active":
        query = query.filter(ReferenceObject.active.is_(True))
    elif status == "inactive":
        query = query.filter(ReferenceObject.active.is_(False))

    if sort == "status":
        query = query.order_by(ReferenceObject.active.desc(), ReferenceObject.name)
    else:
        query = query.order_by(ReferenceObject.name)

    return query.all()


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


@router.post("/{ref_id}/activate", response_model=ReferenceObjectRead)
def activate_reference(ref_id: uuid.UUID, db: Session = Depends(get_db)):
    ref = db.query(ReferenceObject).filter(ReferenceObject.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference object not found")
    ref.active = True
    db.commit()
    db.refresh(ref)
    return ref


@router.delete("/{ref_id}", status_code=204)
def delete_reference(ref_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Hard-deletes a reference object. As a safety rail (Part 12 of the admin
    upgrade requirements), an ACTIVE reference cannot be deleted directly -
    it must be deactivated first. This is a deliberate two-step process:
    deactivating is instantly reversible and immediately removes the
    reference from the public picker and the auto-selection algorithm,
    while deletion is permanent. There's no other table with a live FK into
    reference_objects today, so there's no data-integrity cascade to check
    beyond this - but the two-step rule stays regardless, since "permanent"
    and "reversible" shouldn't be one click apart.
    """
    ref = db.query(ReferenceObject).filter(ReferenceObject.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference object not found")
    if ref.active:
        raise HTTPException(
            status_code=400,
            detail="Deactivate this reference before deleting it.",
        )
    db.delete(ref)
    db.commit()
