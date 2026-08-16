from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class PollutantReading(BaseModel):
    date: date
    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float
    aqi: Optional[float] = None

class PollutantReadingCreate(PollutantReading):
    city: str

class PollutantReadingOut(PollutantReading):
    id: int
    city: str
    created_at: datetime

    class Config:
        from_attributes = True
