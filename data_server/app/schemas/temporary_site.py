from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.temporary_site import PriorityLevel, EventStatus


class TemporarySiteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    start_date: datetime
    end_date: datetime
    priority: PriorityLevel = PriorityLevel.MEDIUM
    status: EventStatus = EventStatus.ACTIVE
    contact_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)


class TemporarySiteCreate(TemporarySiteBase):
    pass


class TemporarySiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: Optional[PriorityLevel] = None
    status: Optional[EventStatus] = None
    contact_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)


class TemporarySiteResponse(TemporarySiteBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

