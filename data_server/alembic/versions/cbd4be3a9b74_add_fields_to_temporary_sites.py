"""add fields to temporary sites

Revision ID: cbd4be3a9b74
Revises: 002
Create Date: 2026-04-23 05:33:58.525048

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cbd4be3a9b74'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns to temporary_sites
    op.add_column('temporary_sites', sa.Column('sub_category', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_temporary_sites_sub_category'), 'temporary_sites', ['sub_category'], unique=False)
    op.add_column('temporary_sites', sa.Column('type', sa.String(length=100), nullable=True))
    op.add_column('temporary_sites', sa.Column('district', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_temporary_sites_district'), 'temporary_sites', ['district'], unique=False)
    op.add_column('temporary_sites', sa.Column('street', sa.String(length=255), nullable=True))
    op.add_column('temporary_sites', sa.Column('house_number', sa.String(length=50), nullable=True))

    # Add columns to temporary_history
    op.add_column('temporary_history', sa.Column('sub_category', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_temporary_history_sub_category'), 'temporary_history', ['sub_category'], unique=False)
    op.add_column('temporary_history', sa.Column('type', sa.String(length=100), nullable=True))
    op.add_column('temporary_history', sa.Column('district', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_temporary_history_district'), 'temporary_history', ['district'], unique=False)
    op.add_column('temporary_history', sa.Column('street', sa.String(length=255), nullable=True))
    op.add_column('temporary_history', sa.Column('house_number', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # Remove columns from temporary_history
    op.drop_column('temporary_history', 'house_number')
    op.drop_column('temporary_history', 'street')
    op.drop_index(op.f('ix_temporary_history_district'), table_name='temporary_history')
    op.drop_column('temporary_history', 'district')
    op.drop_column('temporary_history', 'type')
    op.drop_index(op.f('ix_temporary_history_sub_category'), table_name='temporary_history')
    op.drop_column('temporary_history', 'sub_category')

    # Remove columns from temporary_sites
    op.drop_column('temporary_sites', 'house_number')
    op.drop_column('temporary_sites', 'street')
    op.drop_index(op.f('ix_temporary_sites_district'), table_name='temporary_sites')
    op.drop_column('temporary_sites', 'district')
    op.drop_column('temporary_sites', 'type')
    op.drop_index(op.f('ix_temporary_sites_sub_category'), table_name='temporary_sites')
    op.drop_column('temporary_sites', 'sub_category')
