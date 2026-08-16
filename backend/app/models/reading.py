from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from app.database import Base

class PollutionReading(Base):
    __tablename__ = "pollution_readings"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True, nullable=False)
    reading_date = Column(Date, nullable=False)
    pm25 = Column(Float, nullable=False)
    pm10 = Column(Float, nullable=False)
    no2 = Column(Float, nullable=False)
    so2 = Column(Float, nullable=False)
    co = Column(Float, nullable=False)
    o3 = Column(Float, nullable=False)
    aqi = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
