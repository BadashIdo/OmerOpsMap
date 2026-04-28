"""Orchestrator: drives the per-source sync cycle and emits diff broadcasts.

Pure pipeline. No LLM. Deterministic mirror-and-filter.

REGISTRY maps source name → IntegrationClient instance. New sources only
need to subclass `IntegrationClient` and add a line here.
"""

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List

from app.config import get_settings
from app.services.integrations.base import IntegrationClient, NormalizedFeature, RunResult
from app.services.integrations.geofence import point_in_omer

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class CircuitBreaker:
    failure_threshold: int = 5
    backoff_multiplier: int = 10
    consecutive_failures: int = 0
    open_until_run: int = 0
    skipped_runs: int = field(default=0)

    def is_open(self) -> bool:
        if self.consecutive_failures < self.failure_threshold:
            return False
        if self.skipped_runs < self.backoff_multiplier:
            self.skipped_runs += 1
            return True
        # Allow a probe attempt after the backoff window
        self.skipped_runs = 0
        return False

    def record_success(self) -> None:
        self.consecutive_failures = 0
        self.skipped_runs = 0

    def record_failure(self) -> None:
        self.consecutive_failures += 1
        self.skipped_runs = 0


REGISTRY: Dict[str, IntegrationClient] = {}
BREAKERS: Dict[str, CircuitBreaker] = defaultdict(CircuitBreaker)


def register_client(client: IntegrationClient) -> None:
    """Register a client. Called once at module import time per source."""
    REGISTRY[client.name] = client
    BREAKERS.setdefault(client.name, CircuitBreaker())


def _filter_to_omer(rows: List[NormalizedFeature]) -> List[NormalizedFeature]:
    return [r for r in rows if point_in_omer(r.lat, r.lng, settings.omer_radius_km)]


async def run_sync(source: str) -> RunResult:
    """Execute one sync cycle for `source`. Safe to call from APScheduler."""
    # Deferred imports — keep this module importable without FastAPI / SQLAlchemy
    # in the dev environment for fast unit tests.
    from app.api.websocket import notify_data_changed
    from app.database import AsyncSessionLocal
    from app.repository.external_features import ExternalFeaturesRepository

    client = REGISTRY.get(source)
    if client is None:
        logger.warning("Unknown source: %s", source)
        return RunResult(ok=False, reason=f"unknown_source:{source}")

    breaker = BREAKERS[source]
    if breaker.is_open():
        logger.info("Circuit open for %s, skipping run", source)
        return RunResult(ok=False, reason="circuit_open")

    async with AsyncSessionLocal() as session:
        repo = ExternalFeaturesRepository(session)
        run = await repo.start_run(source)
        run_id = run.id
        try:
            raw = await client.fetch()
            kept = _filter_to_omer(raw)
            added, updated = await repo.upsert_many(source, kept, run_id)
            removed = await repo.mark_stale(source, run_id, client.stale_ttl_seconds)
            await repo.purge_old(source, hours=client.purge_hours)
            await repo.finish_run(run, ok=True, added=added, updated=updated, removed=removed)
            breaker.record_success()
            logger.info(
                "sync %s ok: +%d ~%d -%d (raw=%d, kept=%d)",
                source, added, updated, removed, len(raw), len(kept),
            )
            if added or updated or removed:
                await notify_data_changed(
                    data_type="external",
                    action="sync",
                    data={
                        "source": source,
                        "run_id": str(run_id),
                        "added": added,
                        "updated": updated,
                        "removed": removed,
                    },
                )
            return RunResult(ok=True, added=added, updated=updated, removed=removed)
        except Exception as exc:
            err_msg = repr(exc)
            logger.error("sync %s failed: %s", source, err_msg, exc_info=True)
            await repo.finish_run(run, ok=False, error=err_msg)
            breaker.record_failure()
            return RunResult(ok=False, reason=err_msg)
