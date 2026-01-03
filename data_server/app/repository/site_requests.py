from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timezone

from app.models.site_request import SiteRequest, RequestStatus
from app.models.permanent_site import PermanentSite
from app.models.temporary_site import TemporarySite, PriorityLevel, EventStatus
from app.schemas.site_request import SiteRequestCreate, SiteRequestUpdate


class SiteRequestsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, request_data: SiteRequestCreate) -> SiteRequest:
        """Submit a new site request"""
        request = SiteRequest(**request_data.model_dump())
        self.session.add(request)
        await self.session.commit()
        await self.session.refresh(request)
        return request

    async def get_by_id(self, request_id: int) -> Optional[SiteRequest]:
        """Get a single request by ID"""
        result = await self.session.execute(
            select(SiteRequest).where(SiteRequest.id == request_id)
        )
        return result.scalar_one_or_none()

    async def get_pending(self) -> List[SiteRequest]:
        """Get all pending requests (for admin)"""
        result = await self.session.execute(
            select(SiteRequest)
            .where(SiteRequest.status == RequestStatus.PENDING)
            .order_by(SiteRequest.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all(self, status: Optional[RequestStatus] = None) -> List[SiteRequest]:
        """Get all requests, optionally filtered by status"""
        query = select(SiteRequest).order_by(SiteRequest.created_at.desc())
        if status:
            query = query.where(SiteRequest.status == status)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_count_pending(self) -> int:
        """Get count of pending requests (for badge)"""
        result = await self.session.execute(
            select(func.count(SiteRequest.id))
            .where(SiteRequest.status == RequestStatus.PENDING)
        )
        return result.scalar() or 0

    async def update(self, request_id: int, request_data: SiteRequestUpdate) -> Optional[SiteRequest]:
        """Admin edits request details"""
        request = await self.get_by_id(request_id)
        if not request:
            return None

        update_data = request_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(request, key, value)

        await self.session.commit()
        await self.session.refresh(request)
        return request

    async def approve(self, request_id: int, admin_id: int) -> Optional[dict]:
        """
        Approve a request and create the actual site
        Returns the created site info or None if request not found
        """
        request = await self.get_by_id(request_id)
        if not request:
            return None

        if request.status != RequestStatus.PENDING:
            return None

        # Create the appropriate site
        if request.is_temporary:
            # Create temporary site
            priority_map = {
                "low": PriorityLevel.LOW,
                "medium": PriorityLevel.MEDIUM,
                "high": PriorityLevel.HIGH,
                "critical": PriorityLevel.CRITICAL,
            }
            
            site = TemporarySite(
                name=request.name,
                description=request.description,
                category=request.category,
                lat=request.lat,
                lng=request.lng,
                start_date=request.start_date or datetime.now(timezone.utc),
                end_date=request.end_date,
                priority=priority_map.get(request.priority, PriorityLevel.MEDIUM),
                status=EventStatus.ACTIVE,
                contact_name=request.submitter_name,
                phone=request.submitter_phone,
            )
            site_type = "temporary"
        else:
            # Create permanent site
            site = PermanentSite(
                name=request.name,
                category=request.category,
                sub_category=request.sub_category,
                description=request.description,
                lat=request.lat,
                lng=request.lng,
                contact_name=request.submitter_name,
                phone=request.submitter_phone,
            )
            site_type = "permanent"

        self.session.add(site)

        # Update request status
        request.status = RequestStatus.APPROVED
        request.reviewed_by = admin_id
        request.reviewed_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(site)

        return {
            "site_type": site_type,
            "site_id": site.id,
            "site_name": site.name
        }

    async def reject(self, request_id: int, admin_id: int, reason: str) -> Optional[SiteRequest]:
        """Reject a request with reason"""
        request = await self.get_by_id(request_id)
        if not request:
            return None

        if request.status != RequestStatus.PENDING:
            return None

        request.status = RequestStatus.REJECTED
        request.admin_notes = reason
        request.reviewed_by = admin_id
        request.reviewed_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(request)
        return request

    async def get_by_phone(self, phone: str) -> List[SiteRequest]:
        """Get all requests by submitter phone (for status check)"""
        result = await self.session.execute(
            select(SiteRequest)
            .where(SiteRequest.submitter_phone == phone)
            .order_by(SiteRequest.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete(self, request_id: int) -> bool:
        """Delete a request (admin only)"""
        request = await self.get_by_id(request_id)
        if not request:
            return False

        await self.session.delete(request)
        await self.session.commit()
        return True

