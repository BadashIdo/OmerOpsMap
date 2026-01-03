"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-01-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create permanent_sites table
    op.create_table(
        'permanent_sites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('sub_category', sa.String(length=100), nullable=True),
        sa.Column('type', sa.String(length=100), nullable=True),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('street', sa.String(length=255), nullable=True),
        sa.Column('house_number', sa.String(length=50), nullable=True),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permanent_sites_id'), 'permanent_sites', ['id'], unique=False)
    op.create_index(op.f('ix_permanent_sites_name'), 'permanent_sites', ['name'], unique=False)
    op.create_index(op.f('ix_permanent_sites_category'), 'permanent_sites', ['category'], unique=False)
    op.create_index(op.f('ix_permanent_sites_sub_category'), 'permanent_sites', ['sub_category'], unique=False)
    op.create_index(op.f('ix_permanent_sites_district'), 'permanent_sites', ['district'], unique=False)
    op.create_index(op.f('ix_permanent_sites_lat'), 'permanent_sites', ['lat'], unique=False)
    op.create_index(op.f('ix_permanent_sites_lng'), 'permanent_sites', ['lng'], unique=False)

    # Create temporary_sites table
    op.create_table(
        'temporary_sites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='prioritylevel'), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'PAUSED', 'RESOLVED', name='eventstatus'), nullable=True),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_temporary_sites_id'), 'temporary_sites', ['id'], unique=False)
    op.create_index(op.f('ix_temporary_sites_name'), 'temporary_sites', ['name'], unique=False)
    op.create_index(op.f('ix_temporary_sites_category'), 'temporary_sites', ['category'], unique=False)
    op.create_index(op.f('ix_temporary_sites_lat'), 'temporary_sites', ['lat'], unique=False)
    op.create_index(op.f('ix_temporary_sites_lng'), 'temporary_sites', ['lng'], unique=False)
    op.create_index(op.f('ix_temporary_sites_start_date'), 'temporary_sites', ['start_date'], unique=False)
    op.create_index(op.f('ix_temporary_sites_end_date'), 'temporary_sites', ['end_date'], unique=False)
    op.create_index(op.f('ix_temporary_sites_priority'), 'temporary_sites', ['priority'], unique=False)
    op.create_index(op.f('ix_temporary_sites_status'), 'temporary_sites', ['status'], unique=False)

    # Create temporary_history table
    op.create_table(
        'temporary_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('original_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='prioritylevel'), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'PAUSED', 'RESOLVED', name='eventstatus'), nullable=True),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('archived_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_temporary_history_id'), 'temporary_history', ['id'], unique=False)
    op.create_index(op.f('ix_temporary_history_original_id'), 'temporary_history', ['original_id'], unique=False)
    op.create_index(op.f('ix_temporary_history_name'), 'temporary_history', ['name'], unique=False)
    op.create_index(op.f('ix_temporary_history_category'), 'temporary_history', ['category'], unique=False)
    op.create_index(op.f('ix_temporary_history_archived_at'), 'temporary_history', ['archived_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_temporary_history_archived_at'), table_name='temporary_history')
    op.drop_index(op.f('ix_temporary_history_category'), table_name='temporary_history')
    op.drop_index(op.f('ix_temporary_history_name'), table_name='temporary_history')
    op.drop_index(op.f('ix_temporary_history_original_id'), table_name='temporary_history')
    op.drop_index(op.f('ix_temporary_history_id'), table_name='temporary_history')
    op.drop_table('temporary_history')

    op.drop_index(op.f('ix_temporary_sites_status'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_priority'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_end_date'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_start_date'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_lng'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_lat'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_category'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_name'), table_name='temporary_sites')
    op.drop_index(op.f('ix_temporary_sites_id'), table_name='temporary_sites')
    op.drop_table('temporary_sites')

    op.drop_index(op.f('ix_permanent_sites_lng'), table_name='permanent_sites')
    op.drop_index(op.f('ix_permanent_sites_lat'), table_name='permanent_sites')
    op.drop_index(op.f('ix_permanent_sites_district'), table_name='permanent_sites')
    op.drop_index(op.f('ix_permanent_sites_sub_category'), table_name='permanent_sites')
    op.drop_index(op.f('ix_permanent_sites_category'), table_name='permanent_sites')
    op.drop_index(op.f('ix_permanent_sites_name'), table_name='permanent_sites')
    op.drop_index(op.f('ix_permanent_sites_id'), table_name='permanent_sites')
    op.drop_table('permanent_sites')

