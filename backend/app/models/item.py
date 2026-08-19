import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    variant: Mapped[str | None] = mapped_column(String(120), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    measurements: Mapped[list["ItemMeasurement"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )
    aliases: Mapped[list["ItemAlias"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )

    @property
    def primary_measurement(self) -> "ItemMeasurement | None":
        for m in self.measurements:
            if m.is_primary:
                return m
        return self.measurements[0] if self.measurements else None


class ItemAlias(Base):
    """
    Alternate names / spellings / translations for an item, used by search.
    Kept as a proper table (not a JSON blob) so it can be indexed and
    queried efficiently, and so each alias can carry its own metadata later
    (e.g. locale) without a schema rewrite.
    """

    __tablename__ = "item_aliases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=False
    )
    alias: Mapped[str] = mapped_column(String(200), nullable=False)
    locale: Mapped[str | None] = mapped_column(String(10), nullable=True)

    item: Mapped["Item"] = relationship(back_populates="aliases")


# Measurement strategies supported today. Kept as plain strings (not a DB
# enum type) so adding `unit_count` later is a data-only change, not a
# migration that alters an enum type.
MEASUREMENT_STRATEGIES = ("density", "bulk_density")
CONFIDENCE_LEVELS = ("verified", "estimated", "demo")


class ItemMeasurement(Base):
    """
    Scientific/physical data for an item. Separate from `items` because an
    item may eventually have multiple measurements (different sources,
    variants, or - in the future - a `unit_count` strategy alongside a
    density-based one). The admin explicitly chooses which strategy is
    authoritative via `is_primary` + `strategy`; the app never infers it.
    """

    __tablename__ = "item_measurements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=False
    )

    # 'density' | 'bulk_density' today. 'unit_count' reserved for future use.
    strategy: Mapped[str] = mapped_column(String(30), nullable=False)

    density_kg_m3: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    bulk_density_kg_m3: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)

    # Reserved for the future `unit_count` strategy - not used by the MVP
    # calculation service, but present so the schema doesn't need to change
    # when that strategy is implemented.
    average_unit_weight_g: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    typical_length_mm: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    typical_width_mm: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    typical_height_mm: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)

    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    source: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[str] = mapped_column(String(20), nullable=False, default="estimated")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    item: Mapped["Item"] = relationship(back_populates="measurements")
