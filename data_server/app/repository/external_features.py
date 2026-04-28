"""Repository for `external_features` and `integration_runs`.

The repository hides SQL details from the orchestrator. Upsert semantics
are keyed by `(source, external_id)`; rows without an `external_id` are
keyed by `(source, kind, lat, lng)` instead — used by sources that lack a
stable upstream id (e.g. weather grid cells).
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Iterable, List, Optional, Tuple
from uuid import UUID, uuid4

from sqlalchemy import and_, delete, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.external_feature import ExternalFeature, IntegrationRun
from app.services.integrations.base import NormalizedFeature

# Cap raw payload size so a misbehaving source can't bloat the table.
PAYLOAD_BYTES_CAP = 4096


def _truncate_payload(payload: dict) -> dict:
    """If the JSON-encoded payload exceeds the cap, replace with a marker."""
    try:
        encoded = json.dumps(payload, default=str)
    except (TypeError, ValueError):
        return {"_truncated": True, "_reason": "unserializable"}
    if len(encoded.encode("utf-8")) <= PAYLOAD_BYTES_CAP:
        return payload
    return {"_truncated": True, "_size_bytes": len(encoded.encode("utf-8"))}


class ExternalFeaturesRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ------------------------------------------------------------------
    # Run lifecycle
    # ------------------------------------------------------------------
    async def start_run(self, source: str) -> IntegrationRun:
        run = IntegrationRun(id=uuid4(), source=source, ok=False)
        self.session.add(run)
        await self.session.flush()
        return run

    async def finish_run(
        self,
        run: IntegrationRun,
        *,
        ok: bool,
        added: int = 0,
        updated: int = 0,
        removed: int = 0,
        error: Optional[str] = None,
    ) -> None:
        run.finished_at = datetime.now(timezone.utc)
        run.ok = ok
        run.added = added
        run.updated = updated
        run.removed = removed
        run.error = error
        await self.session.commit()

    # ------------------------------------------------------------------
    # Feature upsert / stale / purge
    # ------------------------------------------------------------------
    async def upsert_many(
        self,
        source: str,
        rows: Iterable[NormalizedFeature],
        run_id: UUID,
    ) -> Tuple[int, int]:
        """Insert/update rows. Returns (added, updated).

        Rows with `external_id`: ON CONFLICT update by `(source, external_id)`.
        Rows without `external_id`: matched by `(source, kind, lat, lng)`
        within ~1 m tolerance.
        """
        now = datetime.now(timezone.utc)
        added = updated = 0

        for row in rows:
            payload = _truncate_payload(row.payload)
            base_values = {
                "source": source,
                "external_id": row.external_id,
                "kind": row.kind,
                "name": row.name,
                "description": row.description,
                "lat": row.lat,
                "lng": row.lng,
                "geom_polyline": row.geom_polyline,
                "payload": payload,
                "severity": row.severity,
                "fetched_at": now,
                "expires_at": row.expires_at,
                "last_sync_run_id": run_id,
                "is_stale": False,
            }

            if row.external_id is not None:
                stmt = pg_insert(ExternalFeature).values(**base_values)
                stmt = stmt.on_conflict_do_update(
                    constraint="uq_external_features_source_external_id",
                    set_={
                        "kind": stmt.excluded.kind,
                        "name": stmt.excluded.name,
                        "description": stmt.excluded.description,
                        "lat": stmt.excluded.lat,
                        "lng": stmt.excluded.lng,
                        "geom_polyline": stmt.excluded.geom_polyline,
                        "payload": stmt.excluded.payload,
                        "severity": stmt.excluded.severity,
                        "fetched_at": stmt.excluded.fetched_at,
                        "expires_at": stmt.excluded.expires_at,
                        "last_sync_run_id": stmt.excluded.last_sync_run_id,
                        "is_stale": False,
                    },
                ).returning(ExternalFeature.id, ExternalFeature.first_seen_at)
                result = await self.session.execute(stmt)
                row_record = result.first()
                # `first_seen_at` equals `fetched_at` only for fresh inserts
                # (server_default=now()). Use that to count adds vs updates.
                if row_record and row_record.first_seen_at is not None:
                    delta = (now - row_record.first_seen_at).total_seconds()
                    if abs(delta) < 1.0:
                        added += 1
                    else:
                        updated += 1
                else:
                    added += 1
            else:
                # Synthetic-id sources: match by (source, kind, lat, lng)
                tol = 1e-5  # ~1 m
                existing_q = select(ExternalFeature).where(
                    and_(
                        ExternalFeature.source == source,
                        ExternalFeature.external_id.is_(None),
                        ExternalFeature.kind == row.kind,
                        ExternalFeature.lat.between(row.lat - tol, row.lat + tol),
                        ExternalFeature.lng.between(row.lng - tol, row.lng + tol),
                    )
                )
                existing = (await self.session.execute(existing_q)).scalar_one_or_none()
                if existing is None:
                    feature = ExternalFeature(**base_values)
                    self.session.add(feature)
                    added += 1
                else:
                    for k, v in base_values.items():
                        if k in {"source", "external_id"}:
                            continue
                        setattr(existing, k, v)
                    updated += 1

        await self.session.flush()
        return added, updated

    async def mark_stale(
        self,
        source: str,
        run_id: UUID,
        stale_ttl_seconds: int = 0,
    ) -> int:
        """Mark rows belonging to `source` not touched by `run_id` as stale.

        Returns the number of rows newly marked stale. If `stale_ttl_seconds`
        is positive, only rows whose `fetched_at` is older than the cutoff
        are marked, giving fast-blink sources (e.g. oref alerts) a grace
        window to avoid UI flicker.
        """
        cutoff_clause = []
        if stale_ttl_seconds > 0:
            cutoff = datetime.now(timezone.utc) - timedelta(seconds=stale_ttl_seconds)
            cutoff_clause.append(ExternalFeature.fetched_at < cutoff)

        stmt = (
            update(ExternalFeature)
            .where(
                ExternalFeature.source == source,
                ExternalFeature.last_sync_run_id != run_id,
                ExternalFeature.is_stale.is_(False),
                *cutoff_clause,
            )
            .values(is_stale=True)
            .execution_options(synchronize_session=False)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount or 0

    async def purge_old(self, source: str, hours: int = 24) -> int:
        """Hard-delete stale rows older than `hours`. Returns deletion count."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        stmt = (
            delete(ExternalFeature)
            .where(
                ExternalFeature.source == source,
                ExternalFeature.is_stale.is_(True),
                ExternalFeature.fetched_at < cutoff,
            )
            .execution_options(synchronize_session=False)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount or 0

    # ------------------------------------------------------------------
    # Read API
    # ------------------------------------------------------------------
    async def list_by_source(
        self,
        source: Optional[str] = None,
        kind: Optional[str] = None,
        since: Optional[datetime] = None,
        include_stale: bool = True,
    ) -> List[ExternalFeature]:
        stmt = select(ExternalFeature).order_by(ExternalFeature.fetched_at.desc())
        if source:
            stmt = stmt.where(ExternalFeature.source == source)
        if kind:
            stmt = stmt.where(ExternalFeature.kind == kind)
        if since:
            stmt = stmt.where(ExternalFeature.fetched_at >= since)
        if not include_stale:
            stmt = stmt.where(ExternalFeature.is_stale.is_(False))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_runs(
        self,
        source: Optional[str] = None,
        limit: int = 50,
    ) -> List[IntegrationRun]:
        stmt = select(IntegrationRun).order_by(IntegrationRun.started_at.desc()).limit(limit)
        if source:
            stmt = stmt.where(IntegrationRun.source == source)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
