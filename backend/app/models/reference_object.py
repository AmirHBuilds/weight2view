import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# Simple procedural geometry for MVP. `model_url` is reserved so a real
# GLTF/GLB asset can replace the procedural shape later without a schema
# change - the frontend just needs to prefer model_url when present.
REFERENCE_SHAPES = ("box", "rounded_box", "cylinder")


class ReferenceObject(Base):
    __tablename__ = "reference_objects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)  # human | everyday | large

    length_mm: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    width_mm: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    height_mm: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    volume_l: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)

    shape: Mapped[str] = mapped_column(String(20), nullable=False, default="box")
    # Reserved for future real 3D assets; NULL => render procedural `shape`.
    model_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    familiarity_score: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=5)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
