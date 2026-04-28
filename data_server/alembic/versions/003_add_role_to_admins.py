"""Add role column to admins table

Revision ID: 003
Revises: 002
Create Date: 2026-04-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add role column to admins table with default value 'admin'
    op.add_column('admins', sa.Column('role', sa.String(length=20), server_default='admin', nullable=False))


def downgrade() -> None:
    op.drop_column('admins', 'role')
