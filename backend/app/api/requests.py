from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item_request import ItemRequest
from app.schemas.item_request import ItemRequestCreate, ItemRequestRead

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("", response_model=ItemRequestRead, status_code=201)
def create_request(payload: ItemRequestCreate, db: Session = Depends(get_db)):
    req = ItemRequest(query_text=payload.query_text.strip())
    db.add(req)
    db.commit()
    db.refresh(req)
    return req
