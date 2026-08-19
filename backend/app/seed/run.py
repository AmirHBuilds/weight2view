"""
Seed the database with demo items and reference objects.

Usage:
    python -m app.seed.run

Idempotent: re-running will skip items/references that already exist
(matched by slug / name) rather than creating duplicates.
"""
from slugify import slugify

from app.database import SessionLocal
from app.models.item import Item, ItemAlias, ItemMeasurement
from app.models.reference_object import ReferenceObject
from app.seed.data.items import ITEMS
from app.seed.data.references import REFERENCES


def seed_items(db) -> tuple[int, int]:
    created, skipped = 0, 0
    for entry in ITEMS:
        slug = slugify(entry["name"])
        existing = db.query(Item).filter(Item.slug == slug).first()
        if existing:
            skipped += 1
            continue

        item = Item(
            name=entry["name"],
            slug=slug,
            category=entry["category"],
            description=entry.get("description"),
            variant=entry.get("variant"),
        )
        db.add(item)
        db.flush()

        for alias in entry.get("aliases", []):
            db.add(ItemAlias(item_id=item.id, alias=alias))

        m = entry["measurement"]
        db.add(
            ItemMeasurement(
                item_id=item.id,
                strategy=m["strategy"],
                density_kg_m3=m.get("density_kg_m3"),
                bulk_density_kg_m3=m.get("bulk_density_kg_m3"),
                average_unit_weight_g=m.get("average_unit_weight_g"),
                typical_length_mm=m.get("typical_length_mm"),
                typical_width_mm=m.get("typical_width_mm"),
                typical_height_mm=m.get("typical_height_mm"),
                is_primary=True,
                source=m.get("source"),
                confidence=m.get("confidence", "estimated"),
                notes=m.get("notes"),
            )
        )
        created += 1

    db.commit()
    return created, skipped


def seed_references(db) -> tuple[int, int]:
    created, skipped = 0, 0
    for entry in REFERENCES:
        existing = db.query(ReferenceObject).filter(ReferenceObject.name == entry["name"]).first()
        if existing:
            skipped += 1
            continue
        db.add(ReferenceObject(**entry))
        created += 1
    db.commit()
    return created, skipped


def main():
    db = SessionLocal()
    try:
        items_created, items_skipped = seed_items(db)
        refs_created, refs_skipped = seed_references(db)
        print(f"Items: {items_created} created, {items_skipped} skipped (already existed)")
        print(f"References: {refs_created} created, {refs_skipped} skipped (already existed)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
