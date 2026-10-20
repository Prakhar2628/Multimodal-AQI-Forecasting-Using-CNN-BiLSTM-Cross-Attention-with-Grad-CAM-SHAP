from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from app.schemas.weather import WeatherInfo
from app.services.weather_service import (
    get_weather,
    get_live_city_aqi,
    get_overall_cities_aqi,
    CITY_COORDINATES
)

router = APIRouter(tags=["Weather & Live Telemetry"])

@router.get("/weather", response_model=WeatherInfo)
async def read_weather(city: str = Query(..., description="Name of the city")):
    weather = get_weather(city)
    if not weather:
        raise HTTPException(status_code=404, detail="Weather information not available for this city.")
    return weather

@router.get("/live-aqi")
async def read_live_aqi(
    city: str = Query(..., description="City name to fetch real-time live AQI for"),
    groq_key: Optional[str] = Query(None, description="Optional Groq API key token")
) -> Dict[str, Any]:
    """Fetch real-time stable AQI and pollutant telemetry for any Indian city powered by Groq API."""
    data = get_live_city_aqi(city=city, custom_key=groq_key)
    return data

@router.get("/overall-cities-aqi")
async def read_overall_cities_aqi(
    groq_key: Optional[str] = Query(None, description="Optional Groq API key override")
) -> Dict[str, Any]:
    """
    Overall API for Indian cities/states (Delhi, Bengaluru, Mumbai, Kolkata, Chennai, etc.).
    Uses Groq API with 1-hour cache to return stable, consistent air quality telemetry across all regions.
    """
    cities_telemetry = get_overall_cities_aqi(custom_key=groq_key)
    return {
        "status": "success",
        "provider": "Groq Telemetry (CPCB NAQI Standard)",
        "cities": cities_telemetry
    }

@router.get("/live-cities")
async def list_supported_live_cities() -> List[str]:
    """List cities supported for direct live AQI tracking."""
    return [c["name"] for c in CITY_COORDINATES.values()]
