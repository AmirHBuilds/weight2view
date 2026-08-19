"""
Item search.

Uses PostgreSQL pg_trgm similarity for fast, deterministic partial/fuzzy
matching across item name + aliases. No AI/embedding search in the MVP.
"""
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.item import Item, ItemAlias

MIN_SIMILARITY = 0.15


def search_items(db: Session, query: str, limit: int = 10) -> list[Item]:
    query = query.strip()
    if not query:
        return []

    name_similarity = func.similarity(Item.name, query)
    alias_similarity = func.similarity(ItemAlias.alias, query)

    stmt = (
        select(Item, func.greatest(name_similarity, func.coalesce(func.max(alias_similarity), 0)).label("score"))
        .outerjoin(ItemAlias, ItemAlias.item_id == Item.id)
        .where(Item.active.is_(True))
        .where(
            or_(
                Item.name.ilike(f"%{query}%"),
                ItemAlias.alias.ilike(f"%{query}%"),
                name_similarity > MIN_SIMILARITY,
                alias_similarity > MIN_SIMILARITY,
            )
        )
        .group_by(Item.id)
        .order_by(func.greatest(name_similarity, func.coalesce(func.max(alias_similarity), 0)).desc())
        .limit(limit)
    )

    rows = db.execute(stmt).all()
    return [row[0] for row in rows]
