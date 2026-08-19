import uuid

from pydantic import BaseModel, ConfigDict, Field


class ItemMeasurementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    strategy: str
    density_kg_m3: float | None
    bulk_density_kg_m3: float | None
    average_unit_weight_g: float | None
    typical_length_mm: float | None
    typical_width_mm: float | None
    typical_height_mm: float | None
    is_primary: bool
    source: str | None
    confidence: str
    notes: str | None


class ItemMeasurementWrite(BaseModel):
    strategy: str = Field(pattern="^(density|bulk_density)$")
    density_kg_m3: float | None = None
    bulk_density_kg_m3: float | None = None
    average_unit_weight_g: float | None = None
    typical_length_mm: float | None = None
    typical_width_mm: float | None = None
    typical_height_mm: float | None = None
    is_primary: bool = True
    source: str | None = None
    confidence: str = Field(default="estimated", pattern="^(verified|estimated|demo)$")
    notes: str | None = None


class ItemSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    category: str
    variant: str | None = None


class ItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    category: str
    description: str | None
    variant: str | None
    active: bool
    measurements: list[ItemMeasurementRead] = []
    aliases: list[str] = []


class ItemCreate(BaseModel):
    name: str
    category: str
    description: str | None = None
    variant: str | None = None
    aliases: list[str] = []
    measurement: ItemMeasurementWrite | None = None


class ItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    description: str | None = None
    variant: str | None = None
    active: bool | None = None
    aliases: list[str] | None = None
