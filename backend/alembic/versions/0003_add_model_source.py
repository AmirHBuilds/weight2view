"""add model_source for GLB asset attribution

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-20
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "reference_objects",
        sa.Column("model_source", sa.String(300), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("reference_objects", "model_source")
