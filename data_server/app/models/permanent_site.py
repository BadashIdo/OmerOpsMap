from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class PermanentSite(Base):
    __tablename__ = "permanent_sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), index=True)
    sub_category = Column(String(100), index=True)
    type = Column(String(100))
    district = Column(String(100), index=True)
    street = Column(String(255))
    house_number = Column(String(50))
    contact_name = Column(String(255))
    phone = Column(String(50))
    description = Column(Text)
    lat = Column(Float, nullable=False, index=True)
    lng = Column(Float, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<PermanentSite(id={self.id}, name='{self.name}')>"

