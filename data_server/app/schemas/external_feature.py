from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class ExternalFeatureRead(BaseModel):
    id: int
    source: str
    external_id: Optional[str]
    kind: str
    name: str
    description: Optional[str]
    lat: float
    lng: float
    geom_polyline: Optional[Any]
    payload: dict
    severity: Optional[int]
    fetched_at: datetime
    first_seen_at: datetime
    expires_at: Optional[datetime]
    is_stale: bool

    class Config:
        from_attributes = True


class IntegrationRunRead(BaseModel):
    id: UUID
    source: str
    started_at: datetime
    finished_at: Optional[datetime]
    ok: bool
    added: int
    updated: int
    removed: int
    error: Optional[str]

    class Config:
        from_attributes = True


class SyncTriggerResponse(BaseModel):
    """Response body from POST /api/integrations/{source}/sync."""
    source: str
    run_id: UUID
    ok: bool
    added: int
    updated: int
    removed: int
    error: Optional[str] = None
