from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, nullable=True, index=True)
    image_path = Column(String, nullable=False)
    predicted_category = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    all_probabilities = Column(JSON, nullable=False)
    health_advisory = Column(JSON, nullable=False)
    weather = Column(JSON, nullable=True)
    readings = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
