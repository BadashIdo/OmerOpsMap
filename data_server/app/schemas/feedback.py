from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


TOPIC_PATTERN = "^(bug|suggestion|map_data|general|other)$"
STATUS_PATTERN = "^(new|in_progress|resolved)$"


class FeedbackBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    topic: str = Field(..., pattern=TOPIC_PATTERN)
    contact: Optional[str] = Field(None, max_length=255)
    description: str = Field(..., min_length=1)


class FeedbackCreate(FeedbackBase):
    """Public submit — guests can only set name/topic/contact/description."""
    pass


class FeedbackAdminCreate(FeedbackBase):
    """Admin manually creating an entry (e.g. recorded by phone) — may also set initial status and admin notes."""
    status: Optional[str] = Field("new", pattern=STATUS_PATTERN)
    admin_notes: Optional[str] = None


class FeedbackUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    topic: Optional[str] = Field(None, pattern=TOPIC_PATTERN)
    contact: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN)
    admin_notes: Optional[str] = None


class FeedbackResponse(FeedbackBase):
    id: int
    status: str
    admin_notes: Optional[str] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
