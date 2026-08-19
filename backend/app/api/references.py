from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reference_object import ReferenceObject
from app.schemas.reference_object import ReferenceObjectRead

router = APIRouter(prefix="/references", tags=["references"])


@router.get("", response_model=list[ReferenceObjectRead])
def list_references(db: Session = Depends(get_db)):
    return db.query(ReferenceObject).filter(ReferenceObject.active.is_(True)).order_by(ReferenceObject.volume_l).all()
