from pydantic import BaseModel
from typing import Dict, Optional, List, Any
from datetime import datetime
from app.schemas.weather import WeatherInfo

class HealthAdvisory(BaseModel):
    risk: str
    asthma_risk: str
    outdoor_exercise: str
    mask: str
    children: str

class PredictionCreate(BaseModel):
    city: Optional[str] = None
    image_path: str
    predicted_category: str
    confidence: float
    all_probabilities: Dict[str, float]
    health_advisory: HealthAdvisory
    weather: Optional[WeatherInfo] = None
    readings: Optional[List[Any]] = None

class PredictionResponse(BaseModel):
    id: int
    city: Optional[str] = None
    predicted_category: str
    confidence: float
    all_probabilities: Dict[str, float]
    health_advisory: HealthAdvisory
    weather: Optional[WeatherInfo] = None
    readings: Optional[List[Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PredictionListItem(BaseModel):
    id: int
    city: Optional[str] = None
    predicted_category: str
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True
