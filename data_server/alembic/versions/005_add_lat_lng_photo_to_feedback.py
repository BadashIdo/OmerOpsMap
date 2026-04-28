"""add lat lng photo to feedback

Revision ID: 005_add_lat_lng_photo_to_feedback
Revises: 004_add_feedback_table
Create Date: 2026-04-28
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
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
