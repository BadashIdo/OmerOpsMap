from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


EXTERNAL_SOURCES = (
    "tomtom_traffic",
    "openmeteo_weather",
    "oref_alert",
    "ims_station",
    "gtfs_bus",
    "sviva_air",
    "firms_fire",
    "usgs_quake",
    "gmaps_place",
)


class ExternalFeature(Base):
    __tablename__ = "external_features"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    source = Column(
        Enum(*EXTERNAL_SOURCES, name="external_source"),
        nullable=False,
        index=True,
    )
    external_id = Column(String(128), nullable=True)
    kind = Column(String(64), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    lat = Column(Float, nullable=False, index=True)
    lng = Column(Float, nullable=False, index=True)
    geom_polyline = Column(JSONB, nullable=True)
    payload = Column(JSONB, nullable=False, server_default="{}")
    severity = Column(SmallInteger, nullable=True)
    fetched_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    first_seen_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_run_id = Column(UUID(as_uuid=True), nullable=False)
    is_stale = Column(Boolean, nullable=False, server_default="false")

    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_external_features_source_external_id"),
        Index("ix_external_features_source_fetched_at", "source", "fetched_at"),
        Index("ix_external_features_source_is_stale", "source", "is_stale"),
    )

    def __repr__(self) -> str:
        return f"<ExternalFeature(id={self.id}, source={self.source}, kind={self.kind})>"


class IntegrationRun(Base):
    __tablename__ = "integration_runs"

    id = Column(UUID(as_uuid=True), primary_key=True)
    source = Column(
        Enum(*EXTERNAL_SOURCES, name="external_source"),
        nullable=False,
        index=True,
    )
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
    ok = Column(Boolean, nullable=False, server_default="false")
    added = Column(Integer, nullable=False, server_default="0")
    updated = Column(Integer, nullable=False, server_default="0")
    removed = Column(Integer, nullable=False, server_default="0")
    error = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_integration_runs_source_started_at", "source", "started_at"),
    )

    def __repr__(self) -> str:
        return f"<IntegrationRun(id={self.id}, source={self.source}, ok={self.ok})>"
