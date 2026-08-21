import uuid

from fastapi import APIRouter, Depends, HTTPException
from slugify import slugify
from sqlalchemy.orm import Session, selectinload

from app.api.admin import AdminAuth
from app.database import get_db
from app.models.item import Item, ItemAlias, ItemMeasurement
from app.models.item_request import ItemRequest
from app.schemas.item import ItemCreate, ItemMeasurementWrite, ItemRead, ItemUpdate

router = APIRouter(prefix="/admin/items", tags=["admin:items"], dependencies=[AdminAuth])


def _to_read(item: Item) -> ItemRead:
    # Build `aliases` as plain strings BEFORE validation rather than after:
    # ItemRead.model_validate(item) with from_attributes=True reads
    # item.aliases directly (a list of ItemAlias ORM objects) into a
    # `list[str]` field, which pydantic rejects outright - it has no way
    # to know an ItemAlias should become its `.alias` string. Passing a
    # dict with the conversion already done sidesteps that entirely.
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


@router.get("", response_model=list[ItemRead])
def list_items(q: str | None = None, include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(Item).options(selectinload(Item.measurements), selectinload(Item.aliases))
    if not include_inactive:
        query = query.filter(Item.active.is_(True))
    if q:
        query = query.filter(Item.name.ilike(f"%{q}%"))
    return [_to_read(i) for i in query.order_by(Item.name).all()]


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = (
        db.query(Item)
        .options(selectinload(Item.measurements), selectinload(Item.aliases))
        .filter(Item.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return _to_read(item)


@router.post("", response_model=ItemRead, status_code=201)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    base_slug = slugify(payload.name)
    slug = base_slug
    i = 2
    while db.query(Item).filter(Item.slug == slug).first():
        slug = f"{base_slug}-{i}"
        i += 1

    item = Item(
        name=payload.name,
        slug=slug,
        category=payload.category,
        description=payload.description,
        variant=payload.variant,
    )
    db.add(item)
    db.flush()

    for alias in payload.aliases:
        db.add(ItemAlias(item_id=item.id, alias=alias))

    if payload.measurement:
        db.add(
            ItemMeasurement(
                item_id=item.id,
                **payload.measurement.model_dump(),
            )
        )

    db.commit()
    db.refresh(item)
    return _to_read(item)


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(item_id: uuid.UUID, payload: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).options(selectinload(Item.measurements), selectinload(Item.aliases)).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"aliases"})
    for key, value in update_data.items():
        setattr(item, key, value)

    if payload.aliases is not None:
        for a in list(item.aliases):
            db.delete(a)
        db.flush()
        for alias in payload.aliases:
            db.add(ItemAlias(item_id=item.id, alias=alias))

    db.commit()
    db.refresh(item)
    return _to_read(item)


@router.post("/{item_id}/deactivate", response_model=ItemRead)
def deactivate_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(Item).options(selectinload(Item.measurements), selectinload(Item.aliases)).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.active = False
    db.commit()
    db.refresh(item)
    return _to_read(item)


@router.post("/{item_id}/activate", response_model=ItemRead)
def activate_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(Item).options(selectinload(Item.measurements), selectinload(Item.aliases)).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.active = True
    db.commit()
    db.refresh(item)
    return _to_read(item)


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Hard-deletes an item. Blocked if any item_request has already been
    resolved to it (item_requests.resulting_item_id is a real FK here,
    unlike references) or if the item is still active - deactivate first,
    matching the same two-step safety rule as references.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.active:
        raise HTTPException(status_code=400, detail="Deactivate this item before deleting it.")

    linked_requests = db.query(ItemRequest).filter(ItemRequest.resulting_item_id == item_id).count()
    if linked_requests:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete: {linked_requests} item request(s) reference this item.",
        )

    db.delete(item)
    db.commit()


@router.put("/{item_id}/measurement", response_model=ItemRead)
def upsert_measurement(item_id: uuid.UUID, payload: ItemMeasurementWrite, db: Session = Depends(get_db)):
    """
    Sets (creates or replaces) the primary measurement for an item.
    The admin explicitly chooses `strategy` here - it is never inferred.
    """
    item = db.query(Item).options(selectinload(Item.measurements), selectinload(Item.aliases)).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.is_primary:
        for m in item.measurements:
            m.is_primary = False

    db.add(ItemMeasurement(item_id=item.id, **payload.model_dump()))
    db.commit()
    db.refresh(item)
    return _to_read(item)
