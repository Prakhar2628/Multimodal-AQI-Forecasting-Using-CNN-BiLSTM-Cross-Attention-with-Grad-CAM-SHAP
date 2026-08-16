from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from app.schemas.weather import WeatherInfo
from app.services.weather_service import get_weather, get_live_city_aqi, CITY_COORDINATES

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
    waqi_token: Optional[str] = Query(None, description="Optional WAQI API key token for ground stations")
) -> Dict[str, Any]:
    """Fetch real-time live AQI and pollutant telemetry for any city (Keyless Open-Meteo or WAQI)."""
    data = get_live_city_aqi(city=city, custom_key=waqi_token)
    return data

@router.get("/live-cities")
async def list_supported_live_cities() -> List[str]:
    """List cities supported for direct keyless live AQI tracking."""
    return [c["name"] for c in CITY_COORDINATES.values()]
