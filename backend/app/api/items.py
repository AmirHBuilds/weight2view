import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.item import Item
from app.schemas.item import ItemRead, ItemSearchResult
from app.services.search import search_items

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/search", response_model=list[ItemSearchResult])
def search(q: str = Query(min_length=1), limit: int = Query(default=10, le=50), db: Session = Depends(get_db)):
    results = search_items(db, q, limit=limit)
    return results


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = (
        db.query(Item)
        .options(selectinload(Item.measurements), selectinload(Item.aliases))
        .filter(Item.id == item_id, Item.active.is_(True))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # See app/api/admin/items.py::_to_read for why aliases are converted
    # to strings before validation rather than after.
    return ItemRead.model_validate(
        {
            "id": item.id,
            "name": item.name,
            "slug": item.slug,
            "category": item.category,
            "description": item.description,
            "variant": item.variant,
            "active": item.active,
            "measurements": item.measurements,
            "aliases": [a.alias for a in item.aliases],
        }
    )
