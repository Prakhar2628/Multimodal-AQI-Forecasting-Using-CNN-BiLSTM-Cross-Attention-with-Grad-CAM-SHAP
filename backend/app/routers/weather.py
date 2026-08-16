from fastapi import APIRouter, HTTPException, Query
from app.schemas.weather import WeatherInfo
from app.services.weather_service import get_weather

router = APIRouter(tags=["Weather"])

@router.get("/weather", response_model=WeatherInfo)
async def read_weather(city: str = Query(..., description="Name of the city")):
    weather = get_weather(city)
    if not weather:
        raise HTTPException(status_code=404, detail="Weather information not available for this city.")
    return weather
