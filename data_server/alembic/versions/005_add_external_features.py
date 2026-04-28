"""Add external_features and integration_runs tables for live external data layers

Revision ID: 005
Revises: 004
Create Date: 2026-04-28 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


EXTERNAL_SOURCES = (
    'tomtom_traffic',
    'openmeteo_weather',
    'oref_alert',
    'ims_station',
    'gtfs_bus',
    'sviva_air',
    'firms_fire',
    'usgs_quake',
    'gmaps_place',
)


def upgrade() -> None:
    external_source_enum = postgresql.ENUM(*EXTERNAL_SOURCES, name='external_source')
    external_source_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'external_features',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('source', external_source_enum, nullable=False),
        sa.Column('external_id', sa.String(length=128), nullable=True),
        sa.Column('kind', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('geom_polyline', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column('severity', sa.SmallInteger(), nullable=True),
        sa.Column('fetched_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('first_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_sync_run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_stale', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source', 'external_id', name='uq_external_features_source_external_id'),
    )
    op.create_index('ix_external_features_source', 'external_features', ['source'])
    op.create_index('ix_external_features_lat', 'external_features', ['lat'])
    op.create_index('ix_external_features_lng', 'external_features', ['lng'])
    op.create_index('ix_external_features_source_fetched_at', 'external_features', ['source', 'fetched_at'])
    op.create_index('ix_external_features_source_is_stale', 'external_features', ['source', 'is_stale'])

    op.create_table(
        'integration_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source', external_source_enum, nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ok', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('added', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('updated', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('removed', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_integration_runs_source', 'integration_runs', ['source'])
    op.create_index('ix_integration_runs_source_started_at', 'integration_runs', ['source', 'started_at'])


def downgrade() -> None:
    op.drop_index('ix_integration_runs_source_started_at', table_name='integration_runs')
    op.drop_index('ix_integration_runs_source', table_name='integration_runs')
    op.drop_table('integration_runs')

    op.drop_index('ix_external_features_source_is_stale', table_name='external_features')
    op.drop_index('ix_external_features_source_fetched_at', table_name='external_features')
    op.drop_index('ix_external_features_lng', table_name='external_features')
    op.drop_index('ix_external_features_lat', table_name='external_features')
    op.drop_index('ix_external_features_source', table_name='external_features')
    op.drop_table('external_features')

    external_source_enum = postgresql.ENUM(*EXTERNAL_SOURCES, name='external_source')
    external_source_enum.drop(op.get_bind(), checkfirst=True)
