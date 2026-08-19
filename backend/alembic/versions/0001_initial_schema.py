"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        "items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(220), nullable=False, unique=True),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("variant", sa.String(120), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_items_slug", "items", ["slug"])
    op.execute("CREATE INDEX idx_items_name_trgm ON items USING gin (name gin_trgm_ops)")

    op.create_table(
        "item_aliases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("alias", sa.String(200), nullable=False),
        sa.Column("locale", sa.String(10), nullable=True),
    )
    op.create_index("idx_item_aliases_item_id", "item_aliases", ["item_id"])
    op.execute("CREATE INDEX idx_item_aliases_alias_trgm ON item_aliases USING gin (alias gin_trgm_ops)")

    op.create_table(
        "item_measurements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("strategy", sa.String(30), nullable=False),
        sa.Column("density_kg_m3", sa.Numeric(12, 3), nullable=True),
        sa.Column("bulk_density_kg_m3", sa.Numeric(12, 3), nullable=True),
        sa.Column("average_unit_weight_g", sa.Numeric(12, 4), nullable=True),
        sa.Column("typical_length_mm", sa.Numeric(12, 3), nullable=True),
        sa.Column("typical_width_mm", sa.Numeric(12, 3), nullable=True),
        sa.Column("typical_height_mm", sa.Numeric(12, 3), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("source", sa.Text(), nullable=True),
        sa.Column("confidence", sa.String(20), nullable=False, server_default="estimated"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("strategy IN ('density', 'bulk_density', 'unit_count')", name="ck_measurement_strategy"),
        sa.CheckConstraint("confidence IN ('verified', 'estimated', 'demo')", name="ck_measurement_confidence"),
    )
    op.create_index("idx_item_measurements_item", "item_measurements", ["item_id"])

    op.create_table(
        "reference_objects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("length_mm", sa.Numeric(12, 2), nullable=False),
        sa.Column("width_mm", sa.Numeric(12, 2), nullable=False),
        sa.Column("height_mm", sa.Numeric(12, 2), nullable=False),
        sa.Column("volume_l", sa.Numeric(12, 4), nullable=False),
        sa.Column("shape", sa.String(20), nullable=False, server_default="box"),
        sa.Column("model_url", sa.String(500), nullable=True),
        sa.Column("familiarity_score", sa.SmallInteger(), nullable=False, server_default="5"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("shape IN ('box', 'rounded_box', 'cylinder')", name="ck_reference_shape"),
        sa.CheckConstraint("familiarity_score BETWEEN 1 AND 10", name="ck_reference_familiarity"),
    )
    op.create_index("idx_reference_objects_volume", "reference_objects", ["volume_l"])

    op.create_table(
        "item_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("query_text", sa.String(300), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("resulting_item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("items.id"), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected', 'completed')", name="ck_request_status"),
    )
    op.create_index("idx_item_requests_status", "item_requests", ["status"])


def downgrade() -> None:
    op.drop_table("item_requests")
    op.drop_table("reference_objects")
    op.drop_table("item_measurements")
    op.drop_table("item_aliases")
    op.drop_table("items")
