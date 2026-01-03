from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime, timezone
from app.models.temporary_site import TemporarySite, TemporaryHistory, EventStatus
from app.schemas.temporary_site import TemporarySiteCreate, TemporarySiteUpdate


class TemporarySitesRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_active(self) -> List[TemporarySite]:
        """Get all active temporary sites (not expired)"""
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(TemporarySite).where(
                and_(
                    TemporarySite.end_date > now,
                    TemporarySite.status == EventStatus.ACTIVE
                )
            )
        )
        return list(result.scalars().all())

    async def get_all(self) -> List[TemporarySite]:
        """Get all temporary sites (including expired)"""
        result = await self.session.execute(select(TemporarySite))
        return list(result.scalars().all())

    async def get_by_id(self, site_id: int) -> Optional[TemporarySite]:
        """Get a temporary site by ID"""
        result = await self.session.execute(
            select(TemporarySite).where(TemporarySite.id == site_id)
        )
        return result.scalar_one_or_none()

    async def create(self, site_data: TemporarySiteCreate) -> TemporarySite:
        """Create a new temporary site"""
        site = TemporarySite(**site_data.model_dump())
        self.session.add(site)
        await self.session.commit()
        await self.session.refresh(site)
        return site

    async def update(self, site_id: int, site_data: TemporarySiteUpdate) -> Optional[TemporarySite]:
        """Update an existing temporary site"""
        site = await self.get_by_id(site_id)
        if not site:
            return None

        update_data = site_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(site, key, value)

        await self.session.commit()
        await self.session.refresh(site)
        return site

    async def delete(self, site_id: int) -> bool:
        """Delete a temporary site"""
        site = await self.get_by_id(site_id)
        if not site:
            return False

        await self.session.delete(site)
        await self.session.commit()
        return True

    async def get_expired(self) -> List[TemporarySite]:
        """Get all expired temporary sites"""
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(TemporarySite).where(TemporarySite.end_date <= now)
        )
        return list(result.scalars().all())

    async def move_to_history(self, site: TemporarySite) -> TemporaryHistory:
        """Move an expired temporary site to history"""
        history = TemporaryHistory(
            original_id=site.id,
            name=site.name,
            description=site.description,
            category=site.category,
            lat=site.lat,
            lng=site.lng,
            start_date=site.start_date,
            end_date=site.end_date,
            priority=site.priority,
            status=site.status,
            contact_name=site.contact_name,
            phone=site.phone,
            created_at=site.created_at,
        )
        
        self.session.add(history)
        await self.session.delete(site)
        await self.session.commit()
        await self.session.refresh(history)
        
        return history

    async def archive_expired(self) -> List[TemporaryHistory]:
        """Archive all expired temporary sites"""
        expired_sites = await self.get_expired()
        archived = []
        
        for site in expired_sites:
            history = await self.move_to_history(site)
            archived.append(history)
        
        return archived

