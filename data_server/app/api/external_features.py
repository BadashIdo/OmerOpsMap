"""HTTP endpoints for external integration data.

Production safety:
- The public read endpoint is fronted by an in-process TTL cache (15 s) so
  a chatty client cannot turn into a DB hammer.
- The admin manual-sync trigger is rate-limited per source so a leaked admin
  token cannot burn paid TomTom quota in a tight loop.
"""

import asyncio
import time
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
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


# ──────────────────────────────────────────────────────────────────────────────
# In-process LRU/TTL cache for the public list endpoint.
# Key = canonicalised query tuple. Value = (expiry_epoch, list[ExternalFeature]).
# ──────────────────────────────────────────────────────────────────────────────
_LIST_CACHE_TTL_SECONDS = 15
_LIST_CACHE_MAX_ENTRIES = 64
_list_cache: dict[Tuple, Tuple[float, list]] = {}
_list_cache_lock = asyncio.Lock()


def _list_cache_key(source, kind, since, include_stale) -> Tuple:
    return (
        source or "",
        kind or "",
        since.isoformat() if since else "",
        bool(include_stale),
    )


async def _list_cache_get(key: Tuple):
    now = time.time()
    async with _list_cache_lock:
        entry = _list_cache.get(key)
        if entry and entry[0] > now:
            return entry[1]
        if entry:
            _list_cache.pop(key, None)
        return None


async def _list_cache_set(key: Tuple, rows: list):
    expiry = time.time() + _LIST_CACHE_TTL_SECONDS
    async with _list_cache_lock:
        # Bound the cache size — drop oldest entries when full.
        if len(_list_cache) >= _LIST_CACHE_MAX_ENTRIES:
            # Evict the entry with the smallest expiry (i.e. oldest).
            oldest_key = min(_list_cache, key=lambda k: _list_cache[k][0])
            _list_cache.pop(oldest_key, None)
        _list_cache[key] = (expiry, rows)


# ──────────────────────────────────────────────────────────────────────────────
# Per-source rate limit on the admin manual-sync trigger.
# In-process, single-instance only. Replace with Redis if we go multi-replica.
# ──────────────────────────────────────────────────────────────────────────────
_SYNC_TRIGGER_MIN_INTERVAL = 60.0  # one manual trigger per source per minute
_last_trigger_at: dict[str, float] = {}
_trigger_lock = asyncio.Lock()


async def _check_and_record_trigger(source: str) -> Optional[float]:
    """Returns seconds-to-wait if the trigger is rate-limited, else None."""
    now = time.time()
    async with _trigger_lock:
        last = _last_trigger_at.get(source, 0.0)
        wait = (last + _SYNC_TRIGGER_MIN_INTERVAL) - now
        if wait > 0:
            return wait
        _last_trigger_at[source] = now
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/api/external-features", response_model=List[ExternalFeatureRead])
async def list_external_features(
    response: Response,
    source: Optional[str] = Query(None, max_length=64),
    kind: Optional[str] = Query(None, max_length=64),
    since: Optional[datetime] = Query(None),
    include_stale: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    """Public read of external features.

    Cached for 15 s (browser + CDN-friendly). Frontend filters by source so
    each layer renders independently.
    """
    cache_key = _list_cache_key(source, kind, since, include_stale)
    cached = await _list_cache_get(cache_key)
    response.headers["Cache-Control"] = f"public, max-age={_LIST_CACHE_TTL_SECONDS}"

    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        return cached

    repo = ExternalFeaturesRepository(db)
    rows = await repo.list_by_source(
        source=source,
        kind=kind,
        since=since,
        include_stale=include_stale,
    )
    await _list_cache_set(cache_key, rows)
    response.headers["X-Cache"] = "MISS"
    return rows


@router.post(
    "/api/integrations/{source}/sync",
    response_model=SyncTriggerResponse,
)
async def trigger_sync(
    source: str,
    _admin=Depends(verify_admin_only),
):
    """Manually trigger a sync for the given source. Admin-only.

    Subadmins are blocked. Rate-limited to one trigger per source per 60 s
    server-side so a leaked token cannot burn paid API quota.
    """
    if source not in REGISTRY:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Unknown source: {source}",
        )

    wait = await _check_and_record_trigger(source)
    if wait is not None:
        raise HTTPException(
            status_code=http_status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Manual trigger rate-limited; retry in {int(wait) + 1}s",
            headers={"Retry-After": str(int(wait) + 1)},
        )

    result = await run_sync(source)

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
