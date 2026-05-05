from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta, timezone
import logging

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.repository.temporary_sites import TemporarySitesRepository
from app.api.websocket import notify_data_changed
from app.services.integrations import registry as integrations_registry
from app.services.integrations.sync import REGISTRY, run_sync

logger = logging.getLogger(__name__)

settings = get_settings()
# Bump the executor max workers so adding ~10 integration jobs cannot starve
# the existing archive_expired_events job. Also tolerate misfires up to 60 s
# before skipping (default behavior is to skip if missed by even a moment).
scheduler = AsyncIOScheduler(
    job_defaults={"misfire_grace_time": 60, "coalesce": True, "max_instances": 1},
)


async def archive_expired_events():
    """Background task to archive expired temporary events"""
    logger.info("Running expiry check...")
    
    try:
        async with AsyncSessionLocal() as session:
            repo = TemporarySitesRepository(session)
            archived = await repo.archive_expired()
            
            if archived:
                logger.info(f"Archived {len(archived)} expired events")
                
                # Notify all connected clients about expired events
                for event in archived:
                    await notify_data_changed(
                        data_type="temporary",
                        action="expired",
                        data={
                            "id": event.original_id,
                            "name": event.name,
                            "archived_at": event.archived_at.isoformat() if event.archived_at else None
                        }
                    )
            else:
                logger.debug("No expired events found")
                
    except Exception as e:
        logger.error(f"Error in archive_expired_events: {e}", exc_info=True)


def register_integration_jobs() -> None:
    """Register one APScheduler job per integration client.

    Skipped clients (`is_disabled`) are not added. Each registration is
    wrapped so a buggy import for one source does not prevent the rest
    (or `archive_expired_events`) from registering.
    """
    if not settings.external_sync_enabled:
        logger.warning("EXTERNAL_SYNC_ENABLED=false — skipping integration jobs")
        return

    integrations_registry.register_all()

    # Stagger first runs across sources so we don't hammer the DB at boot:
    # each source fires a few seconds apart. Without an explicit
    # next_run_time, IntervalTrigger waits a full cadence_seconds — so a
    # 15 minute Open-Meteo job would not run at all for the first 15 min.
    now = datetime.now(timezone.utc)
    stagger_seconds = 0
    for source_name, client in REGISTRY.items():
        if client.is_disabled():
            logger.warning("Skipping job for %s — client disabled", source_name)
            continue
        first_run = now + timedelta(seconds=5 + stagger_seconds)
        try:
            scheduler.add_job(
                run_sync,
                trigger=IntervalTrigger(
                    seconds=client.cadence_seconds,
                    jitter=10,
                ),
                kwargs={"source": source_name},
                id=f"sync_{source_name}",
                name=f"Sync external source {source_name}",
                max_instances=1,
                coalesce=True,
                replace_existing=True,
                next_run_time=first_run,
            )
            logger.info(
                "Registered integration job: %s (cadence=%ds, first run at %s)",
                source_name,
                client.cadence_seconds,
                first_run.isoformat(timespec="seconds"),
            )
            stagger_seconds += 7
        except Exception as exc:  # noqa: BLE001 — never let one source break the others
            logger.error("Failed to register integration job %s: %r", source_name, exc)


def start_scheduler():
    """Start the expiry scheduler"""
    # Run every minute
    scheduler.add_job(
        archive_expired_events,
        trigger=IntervalTrigger(minutes=1),
        id="archive_expired_events",
        name="Archive expired temporary events",
        replace_existing=True
    )

    register_integration_jobs()

    scheduler.start()
    logger.info("Scheduler started — expiry job + integration jobs")


def stop_scheduler():
    """Stop the expiry scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")

