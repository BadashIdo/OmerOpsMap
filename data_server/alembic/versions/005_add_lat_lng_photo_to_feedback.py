"""add lat lng photo to feedback

Revision ID: 006_feedback_fields
Revises: 005
Create Date: 2026-04-28
"""
from alembic import op
import sqlalchemy as sa

revision = "006_feedback_fields"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("feedback", sa.Column("lat", sa.Float(), nullable=True))
    op.add_column("feedback", sa.Column("lng", sa.Float(), nullable=True))
    op.add_column("feedback", sa.Column("photo_url", sa.String(500), nullable=True))


def downgrade():
    op.drop_column("feedback", "photo_url")
    op.drop_column("feedback", "lng")
    op.drop_column("feedback", "lat")
