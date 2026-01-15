from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.site_request import RequestType, RequestStatus


class SiteRequestBase(BaseModel):
    request_type: RequestType
    is_temporary: bool = True
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    sub_category: str = Field(..., min_length=1, max_length=100)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: Optional[str] = Field("medium", pattern="^(low|medium|high|critical)$")


class SiteRequestCreate(SiteRequestBase):
    """Schema for creating a new request (public submission)"""
    submitter_name: str = Field(..., min_length=2, max_length=100)
    submitter_phone: Optional[str] = Field(None, max_length=20)
    submitter_email: Optional[str] = Field(None, max_length=255)


class SiteRequestUpdate(BaseModel):
    """Schema for admin updating a request before approval"""
    request_type: Optional[RequestType] = None
    is_temporary: Optional[bool] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    sub_category: Optional[str] = Field(None, max_length=100)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    admin_notes: Optional[str] = None


class SiteRequestResponse(SiteRequestBase):
    """Full response including status and submitter info"""
    id: int
    submitter_name: str
    submitter_phone: Optional[str]
    submitter_email: Optional[str]
    status: RequestStatus
    admin_notes: Optional[str]
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class SiteRequestPublicResponse(BaseModel):
    """Public response (for checking own request status)"""
    id: int
    name: str
    request_type: RequestType
    status: RequestStatus
    created_at: Optional[datetime]
    admin_notes: Optional[str]  # Shown only if rejected

    class Config:
        from_attributes = True


class RejectRequest(BaseModel):
    """Schema for rejecting a request"""
    reason: str = Field(..., min_length=1, max_length=500)


class RequestCountResponse(BaseModel):
    """Response for pending request count"""
    pending_count: int

