import uuid

from pydantic import BaseModel, ConfigDict, Field


class ReferenceObjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: uuid.UUID
    name: str
    category: str
    length_mm: float
    width_mm: float
    height_mm: float
    volume_l: float
    shape: str
    model_url: str | None
    model_source: str | None
    familiarity_score: int
    active: bool


class ReferenceObjectWrite(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str
    category: str
    length_mm: float = Field(gt=0)
    width_mm: float = Field(gt=0)
    height_mm: float = Field(gt=0)
    shape: str = Field(default="box", pattern="^(box|rounded_box|cylinder|phone|bottle|mug|shoe|backpack|fridge|washing_machine|car|motorcycle|bicycle)$")
    model_url: str | None = None
    model_source: str | None = None
    familiarity_score: int = Field(default=5, ge=1, le=10)
    active: bool = True
