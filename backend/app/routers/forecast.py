from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import math
import random

router = APIRouter(tags=["Forecast"])

class ForecastRequest(BaseModel):
    base_aqi: float
    base_pm25: float
    base_pm10: float
    base_no2: float
    base_o3: float
    city: Optional[str] = None
    pm25_modifier: float = 0.0   # from what-if slider (-50 to +50%)
    pm10_modifier: float = 0.0

class ForecastPoint(BaseModel):
    hour: str
    aqi: float
    pm25: float
    pm10: float
    no2: float
    o3: float

class CounterfactualPoint(BaseModel):
    hour: str
    original_aqi: float
    modified_aqi: float

class ForecastResponse(BaseModel):
    forecast: List[ForecastPoint]
    counterfactual: List[CounterfactualPoint]
    peak_hour: str
    peak_aqi: float
    summary: str

def simulate_diurnal(base: float, hour: int, amplitude: float = 0.25) -> float:
    """Simulate diurnal (day/night) cycle variation with noise."""
    # Peak around 8am and 6pm (traffic), trough at 4am
    cycle = 1 + amplitude * math.sin((hour - 4) * math.pi / 12)
    noise = random.uniform(-0.05, 0.05)
    return max(0, base * (cycle + noise))

@router.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    forecast_points: List[ForecastPoint] = []
    counterfactual_points: List[CounterfactualPoint] = []

    peak_aqi = 0.0
    peak_hour = "00:00"

    for hour in range(24):
        hour_str = f"{hour:02d}:00"

        aqi_val = simulate_diurnal(request.base_aqi, hour, 0.30)
        pm25_val = simulate_diurnal(request.base_pm25, hour, 0.35)
        pm10_val = simulate_diurnal(request.base_pm10, hour, 0.28)
        no2_val = simulate_diurnal(request.base_no2, hour, 0.40)
        o3_val = simulate_diurnal(request.base_o3, hour, 0.25)

        forecast_points.append(ForecastPoint(
            hour=hour_str,
            aqi=round(aqi_val, 1),
            pm25=round(pm25_val, 1),
            pm10=round(pm10_val, 1),
            no2=round(no2_val, 1),
            o3=round(o3_val, 1)
        ))

        if aqi_val > peak_aqi:
            peak_aqi = aqi_val
            peak_hour = hour_str

        # Counterfactual: apply user modifier to PM2.5 and PM10
        pm25_mod_factor = 1 + (request.pm25_modifier / 100)
        pm10_mod_factor = 1 + (request.pm10_modifier / 100)
        mod_pm25 = pm25_val * pm25_mod_factor
        mod_pm10 = pm10_val * pm10_mod_factor
        # Approximate modified AQI (simplified linear model)
        mod_aqi = aqi_val * ((pm25_mod_factor * 0.6) + (pm10_mod_factor * 0.4))

        counterfactual_points.append(CounterfactualPoint(
            hour=hour_str,
            original_aqi=round(aqi_val, 1),
            modified_aqi=round(mod_aqi, 1)
        ))

    # Generate summary
    peak_aqi_rounded = round(peak_aqi, 1)
    if peak_aqi < 50:
        summary = f"Air quality is projected to remain Good throughout the day, peaking at {peak_aqi_rounded} at {peak_hour}."
    elif peak_aqi < 100:
        summary = f"Moderate air quality expected. Peak AQI of {peak_aqi_rounded} at {peak_hour} — sensitive individuals should limit outdoor exposure."
    elif peak_aqi < 150:
        summary = f"Unhealthy conditions for sensitive groups peak at {peak_aqi_rounded} ({peak_hour}). General public should reduce prolonged outdoor activity."
    else:
        summary = f"Hazardous air quality alert! Peak AQI of {peak_aqi_rounded} at {peak_hour}. Avoid outdoor exposure."

    return ForecastResponse(
        forecast=forecast_points,
        counterfactual=counterfactual_points,
        peak_hour=peak_hour,
        peak_aqi=round(peak_aqi, 1),
        summary=summary
    )
