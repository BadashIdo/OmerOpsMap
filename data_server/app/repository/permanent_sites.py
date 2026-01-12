from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models.permanent_site import PermanentSite
from app.schemas.permanent_site import PermanentSiteCreate, PermanentSiteUpdate


class PermanentSitesRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> List[PermanentSite]:
        """Get all permanent sites"""
        result = await self.session.execute(select(PermanentSite))
        return list(result.scalars().all())

    async def get_by_id(self, site_id: int) -> Optional[PermanentSite]:
        """Get a permanent site by ID"""
        result = await self.session.execute(
            select(PermanentSite).where(PermanentSite.id == site_id)
        )
        return result.scalar_one_or_none()

    async def create(self, site_data: PermanentSiteCreate) -> PermanentSite:
        """Create a new permanent site"""
        site = PermanentSite(**site_data.model_dump())
        self.session.add(site)
        await self.session.commit()
        await self.session.refresh(site)
        return site

    async def update(self, site_id: int, site_data: PermanentSiteUpdate) -> Optional[PermanentSite]:
        """Update an existing permanent site"""
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
        """Delete a permanent site"""
        site = await self.get_by_id(site_id)
        if not site:
            return False

        await self.session.delete(site)
        await self.session.commit()
        return True

