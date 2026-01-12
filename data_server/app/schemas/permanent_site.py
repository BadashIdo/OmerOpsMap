from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PermanentSiteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    sub_category: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    street: Optional[str] = Field(None, max_length=255)
    house_number: Optional[str] = Field(None, max_length=50)
    contact_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class PermanentSiteCreate(PermanentSiteBase):
    pass


class PermanentSiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    sub_category: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    street: Optional[str] = Field(None, max_length=255)
    house_number: Optional[str] = Field(None, max_length=50)
    contact_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)


class PermanentSiteResponse(PermanentSiteBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

