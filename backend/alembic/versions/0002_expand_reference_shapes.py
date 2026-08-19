"""expand reference shape options for stylized models

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-19
"""
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

OLD_SHAPES = ("box", "rounded_box", "cylinder")
NEW_SHAPES = (
    "box",
    "rounded_box",
    "cylinder",
    "phone",
    "bottle",
    "mug",
    "shoe",
    "backpack",
    "fridge",
    "washing_machine",
    "car",
    "motorcycle",
    "bicycle",
)


def upgrade() -> None:
    op.drop_constraint("ck_reference_shape", "reference_objects", type_="check")
    shapes_sql = ", ".join(f"'{s}'" for s in NEW_SHAPES)
    op.create_check_constraint(
        "ck_reference_shape", "reference_objects", f"shape IN ({shapes_sql})"
    )


def downgrade() -> None:
    op.drop_constraint("ck_reference_shape", "reference_objects", type_="check")
    shapes_sql = ", ".join(f"'{s}'" for s in OLD_SHAPES)
    op.create_check_constraint(
        "ck_reference_shape", "reference_objects", f"shape IN ({shapes_sql})"
    )
