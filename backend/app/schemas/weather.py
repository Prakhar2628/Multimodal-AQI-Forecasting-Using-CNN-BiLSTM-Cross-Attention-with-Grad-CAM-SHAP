from pydantic import BaseModel

class WeatherInfo(BaseModel):
    temperature_c: float
    humidity_pct: float
    wind_speed_ms: float
    description: str
