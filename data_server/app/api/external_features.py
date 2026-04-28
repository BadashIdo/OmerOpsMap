"""HTTP endpoints for external integration data."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.admin import verify_admin, verify_admin_only
from app.database import get_db
from app.repository.external_features import ExternalFeaturesRepository
from app.schemas.external_feature import (
    ExternalFeatureRead,
    IntegrationRunRead,
    SyncTriggerResponse,
)
from app.services.integrations.sync import REGISTRY, run_sync

router = APIRouter(tags=["external"])


@router.get("/api/external-features", response_model=List[ExternalFeatureRead])
async def list_external_features(
    source: Optional[str] = Query(None, max_length=64),
    kind: Optional[str] = Query(None, max_length=64),
    since: Optional[datetime] = Query(None),
    include_stale: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    """Public read of external features.

    Filtering by `source` is the common case — the frontend keeps each
    source on its own toggleable layer.
    """
    repo = ExternalFeaturesRepository(db)
    rows = await repo.list_by_source(
        source=source,
        kind=kind,
        since=since,
        include_stale=include_stale,
    )
    return rows


@router.post(
    "/api/integrations/{source}/sync",
    response_model=SyncTriggerResponse,
)
async def trigger_sync(
    source: str,
    _admin=Depends(verify_admin_only),
):
    """Manually trigger a sync for the given source. Admin-only — burns API quota.

    Subadmins are blocked here on purpose.
    """
    if source not in REGISTRY:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Unknown source: {source}",
        )
    result = await run_sync(source)

    # The orchestrator already wrote a row to integration_runs. Surface a
    # convenience response so admins can see the diff immediately.
    # We don't have the run_id back from `run_sync`, so callers should query
    # /api/integrations/runs to inspect history. For now return zero UUID —
    # admins are expected to look at the runs endpoint for forensic detail.
    from uuid import UUID
    return SyncTriggerResponse(
        source=source,
        run_id=UUID(int=0),
        ok=result.ok,
        added=result.added,
        updated=result.updated,
        removed=result.removed,
        error=result.reason,
    )


@router.get(
    "/api/integrations/runs",
    response_model=List[IntegrationRunRead],
)
async def list_runs(
    source: Optional[str] = Query(None, max_length=64),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_admin),
):
    """List recent integration runs for ops visibility (admin + subadmin)."""
    repo = ExternalFeaturesRepository(db)
    return await repo.list_runs(source=source, limit=limit)


@router.get("/api/integrations/sources", response_model=List[str])
async def list_sources():
    """List all registered source names. Useful for the LayersControl UI."""
    return sorted(REGISTRY.keys())
