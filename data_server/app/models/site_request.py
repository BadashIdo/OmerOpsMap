from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class RequestType(str, enum.Enum):
    HAZARD = "hazard"           # מפגע
    ROADWORK = "roadwork"       # עבודות
    EVENT = "event"             # אירוע
    NEW_SITE = "new_site"       # אתר חדש
    CORRECTION = "correction"   # תיקון
    OTHER = "other"             # אחר


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class SiteRequest(Base):
    __tablename__ = "site_requests"

    id = Column(Integer, primary_key=True, index=True)
    
    # Request type and content
    request_type = Column(Enum(RequestType), nullable=False, index=True)
    is_temporary = Column(Boolean, default=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    sub_category = Column(String(100))
    
    # Location
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    
    # For temporary requests
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    
    # Submitter info (required)
    submitter_name = Column(String(100), nullable=False)
    submitter_phone = Column(String(20))
    submitter_email = Column(String(255))
    
    # Status and review
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, index=True)
    admin_notes = Column(Text)
    reviewed_by = Column(Integer, ForeignKey('admins.id'), nullable=True)
    reviewed_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<SiteRequest(id={self.id}, name='{self.name}', status={self.status})>"

