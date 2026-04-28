from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from app.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    topic = Column(String(30), nullable=False)
    contact = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default="new", index=True)
    admin_notes = Column(Text, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Feedback(id={self.id}, topic='{self.topic}', status='{self.status}')>"
