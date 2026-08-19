from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.item import Item
from app.models.reference_object import ReferenceObject
from app.schemas.calculation import CalculateRequest, CalculateResponse, ReferenceOption, VolumeShape
from app.services.calculation import CalculationError, MeasurementData, calculate_mass_to_volume, cuboid_dimensions_mm_for_volume
from app.services.reference_selection import ReferenceCandidate, rank_references

router = APIRouter(tags=["calculate"])


@router.post("/calculate", response_model=CalculateResponse)
def calculate(payload: CalculateRequest, db: Session = Depends(get_db)):
    item = (
        db.query(Item)
        .options(selectinload(Item.measurements))
        .filter(Item.id == payload.item_id, Item.active.is_(True))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    measurement = item.primary_measurement
    if not measurement:
        raise HTTPException(status_code=422, detail="Item has no measurement data configured yet")

    measurement_data = MeasurementData(
        strategy=measurement.strategy,
        density_kg_m3=float(measurement.density_kg_m3) if measurement.density_kg_m3 is not None else None,
        bulk_density_kg_m3=float(measurement.bulk_density_kg_m3) if measurement.bulk_density_kg_m3 is not None else None,
        confidence=measurement.confidence,
        source=measurement.source,
        notes=measurement.notes,
    )

    try:
        result = calculate_mass_to_volume(payload.amount, payload.unit, measurement_data)
    except CalculationError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    length_mm, width_mm, height_mm = cuboid_dimensions_mm_for_volume(result.volume_l)

    ref_rows = db.query(ReferenceObject).filter(ReferenceObject.active.is_(True)).all()
    candidates = [
        ReferenceCandidate(
            id=str(r.id),
            name=r.name,
            category=r.category,
            volume_l=float(r.volume_l),
            familiarity_score=r.familiarity_score,
        )
        for r in ref_rows
    ]
    ranked = rank_references(result.volume_l, candidates, limit=5)
    ref_by_id = {str(r.id): r for r in ref_rows}

    def to_option(scored) -> ReferenceOption:
        ref = ref_by_id[scored.candidate.id]
        multiple = result.volume_l / float(ref.volume_l) if ref.volume_l else 0.0
        return ReferenceOption(
            id=ref.id,
            name=ref.name,
            category=ref.category,
            volume_l=float(ref.volume_l),
            familiarity_score=ref.familiarity_score,
            score=scored.score,
            multiple=multiple,
        )

    alternatives = [to_option(s) for s in ranked]
    best = alternatives[0] if alternatives else None

    return CalculateResponse(
        item_id=item.id,
        item_name=item.name,
        amount=payload.amount,
        unit=payload.unit,
        mass_g=result.mass_g,
        volume_l=result.volume_l,
        strategy_used=result.strategy_used,
        confidence=result.confidence,
        source=result.source,
        notes=result.notes,
        shape=VolumeShape(length_mm=length_mm, width_mm=width_mm, height_mm=height_mm),
        best_reference=best,
        reference_alternatives=alternatives,
    )
