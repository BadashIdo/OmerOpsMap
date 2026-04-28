from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from app.models.feedback import Feedback
from pydantic import BaseModel
from app.schemas.feedback import FeedbackUpdate


class FeedbackRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(
        self,
        status: Optional[str] = None,
        topic: Optional[str] = None,
        q: Optional[str] = None,
    ) -> List[Feedback]:
        stmt = select(Feedback).order_by(Feedback.created_at.desc())
        if status:
            stmt = stmt.where(Feedback.status == status)
        if topic:
            stmt = stmt.where(Feedback.topic == topic)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(or_(Feedback.name.ilike(like), Feedback.description.ilike(like)))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, feedback_id: int) -> Optional[Feedback]:
        result = await self.session.execute(
            select(Feedback).where(Feedback.id == feedback_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: BaseModel, photo_url: str = None) -> Feedback:
        fb = Feedback(**data.model_dump())
        if photo_url is not None:
            fb.photo_url = photo_url
        self.session.add(fb)
        await self.session.commit()
        await self.session.refresh(fb)
        return fb

    async def update(self, feedback_id: int, data: FeedbackUpdate) -> Optional[Feedback]:
        fb = await self.get_by_id(feedback_id)
        if not fb:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(fb, key, value)

        await self.session.commit()
        await self.session.refresh(fb)
        return fb

    async def delete(self, feedback_id: int) -> bool:
        fb = await self.get_by_id(feedback_id)
        if not fb:
            return False

        await self.session.delete(fb)
        await self.session.commit()
        return True

    async def count_new(self) -> int:
        result = await self.session.execute(
            select(func.count(Feedback.id)).where(Feedback.status == "new")
        )
        return result.scalar() or 0
