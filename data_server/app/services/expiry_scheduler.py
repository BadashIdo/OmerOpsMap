from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
import asyncio

from app.database import AsyncSessionLocal
from app.repository.temporary_sites import TemporarySitesRepository
from app.api.websocket import notify_data_changed

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


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
    
    scheduler.start()
    logger.info("Scheduler started - checking for expired events every minute")


def stop_scheduler():
    """Stop the expiry scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")

