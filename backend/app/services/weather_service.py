import requests
from app.config import settings
from app.schemas.weather import WeatherInfo

def get_weather(city: str) -> WeatherInfo | None:
    if not settings.WEATHER_API_KEY or settings.WEATHER_API_KEY.startswith("<"):
        return None
        
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={settings.WEATHER_API_KEY}&units=metric"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        return WeatherInfo(
            temperature_c=data["main"]["temp"],
            humidity_pct=data["main"]["humidity"],
            wind_speed_ms=data["wind"]["speed"],
            description=data["weather"][0]["description"].capitalize()
        )
    except Exception as e:
        print(f"Error fetching weather for {city}: {e}")
        return None
