import uuid

from pydantic import BaseModel, Field


class CalculateRequest(BaseModel):
    item_id: uuid.UUID
    amount: float = Field(gt=0)
    unit: str = Field(description="Mass unit: mg | g | kg | oz | lb")


class ReferenceOption(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    volume_l: float
    familiarity_score: int
    score: float
    multiple: float  # how many of this reference fit in the target volume (or vice versa)


class VolumeShape(BaseModel):
    length_mm: float
    width_mm: float
    height_mm: float


class CalculateResponse(BaseModel):
    item_id: uuid.UUID
    item_name: str
    amount: float
    unit: str
    mass_g: float
    volume_l: float
    strategy_used: str
    confidence: str
    source: str | None
    notes: str | None
    shape: VolumeShape
    best_reference: ReferenceOption | None
    reference_alternatives: list[ReferenceOption]
