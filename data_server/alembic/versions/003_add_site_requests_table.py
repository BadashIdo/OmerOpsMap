"""Add site_requests table

Revision ID: 003
Revises: 002
Create Date: 2026-01-02 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create site_requests table
    # Note: Enums are created automatically by SQLAlchemy when creating the table
    op.create_table(
        'site_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_type', sa.Enum('HAZARD', 'ROADWORK', 'EVENT', 'NEW_SITE', 'CORRECTION', 'OTHER', name='requesttype'), nullable=False),
        sa.Column('is_temporary', sa.Boolean(), default=True, nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('sub_category', sa.String(length=100), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', sa.String(length=20), default='medium', nullable=True),
        sa.Column('submitter_name', sa.String(length=100), nullable=False),
        sa.Column('submitter_phone', sa.String(length=20), nullable=True),
        sa.Column('submitter_email', sa.String(length=255), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='requeststatus'), default='PENDING', nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['reviewed_by'], ['admins.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_site_requests_id'), 'site_requests', ['id'], unique=False)
    op.create_index(op.f('ix_site_requests_request_type'), 'site_requests', ['request_type'], unique=False)
    op.create_index(op.f('ix_site_requests_is_temporary'), 'site_requests', ['is_temporary'], unique=False)
    op.create_index(op.f('ix_site_requests_category'), 'site_requests', ['category'], unique=False)
    op.create_index(op.f('ix_site_requests_status'), 'site_requests', ['status'], unique=False)
    op.create_index(op.f('ix_site_requests_created_at'), 'site_requests', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_site_requests_created_at'), table_name='site_requests')
    op.drop_index(op.f('ix_site_requests_status'), table_name='site_requests')
    op.drop_index(op.f('ix_site_requests_category'), table_name='site_requests')
    op.drop_index(op.f('ix_site_requests_is_temporary'), table_name='site_requests')
    op.drop_index(op.f('ix_site_requests_request_type'), table_name='site_requests')
    op.drop_index(op.f('ix_site_requests_id'), table_name='site_requests')
    op.drop_table('site_requests')
    
    # Drop enums
    sa.Enum(name='requeststatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='requesttype').drop(op.get_bind(), checkfirst=True)

