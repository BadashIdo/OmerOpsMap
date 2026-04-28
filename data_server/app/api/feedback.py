from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.repository.feedback import FeedbackRepository
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackAdminCreate,
    FeedbackUpdate,
    FeedbackResponse,
    TOPIC_PATTERN,
    STATUS_PATTERN,
)
from app.auth.admin import verify_admin_only
from app.api.websocket import notify_data_changed

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=http_status.HTTP_201_CREATED)
async def create_feedback(
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a new feedback (public — guests and any user)."""
    repo = FeedbackRepository(db)
    fb = await repo.create(data)
    await notify_data_changed("feedback", "create", {"id": fb.id})
    return fb


@router.get("", response_model=List[FeedbackResponse])
async def list_feedback(
    status: Optional[str] = Query(None, pattern=STATUS_PATTERN),
    topic: Optional[str] = Query(None, pattern=TOPIC_PATTERN),
    q: Optional[str] = Query(None, max_length=255),
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_admin_only),
):
    """List feedback with optional filters (admin only)."""
    repo = FeedbackRepository(db)
    return await repo.get_all(status=status, topic=topic, q=q)


@router.get("/count-new")
async def feedback_count_new(
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_admin_only),
):
    """Count of feedback with status=new (admin only) — used for the tab badge."""
    repo = FeedbackRepository(db)
    return {"count": await repo.count_new()}


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_admin_only),
):
    """Get a single feedback (admin only)."""
    repo = FeedbackRepository(db)
    fb = await repo.get_by_id(feedback_id)
    if not fb:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    return fb


@router.put("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: int,
    data: FeedbackUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_admin_only),
):
    """Edit feedback content / status / admin notes (admin only)."""
    repo = FeedbackRepository(db)
    fb = await repo.update(feedback_id, data)
    if not fb:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    await notify_data_changed("feedback", "update", {"id": fb.id})
    return fb


@router.delete("/{feedback_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_feedback(
    feedback_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_admin_only),
):
    """Delete feedback (admin only)."""
    repo = FeedbackRepository(db)
    success = await repo.delete(feedback_id)
    if not success:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    await notify_data_changed("feedback", "delete", {"id": feedback_id})
    return None


@router.post("/admin", response_model=FeedbackResponse, status_code=http_status.HTTP_201_CREATED)
async def create_feedback_as_admin(
    data: FeedbackAdminCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_admin_only),
):
    """Admin manually adds a feedback entry (e.g. recorded by phone). May set status + admin_notes upfront."""
    repo = FeedbackRepository(db)
    fb = await repo.create(data)
    await notify_data_changed("feedback", "create", {"id": fb.id})
    return fb
