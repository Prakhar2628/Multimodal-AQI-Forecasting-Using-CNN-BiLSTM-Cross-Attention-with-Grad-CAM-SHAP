import requests
from typing import Optional, Dict, Any
from app.config import settings
from app.schemas.weather import WeatherInfo

CITY_COORDINATES: Dict[str, Dict[str, float]] = {
    "delhi": {"lat": 28.6139, "lon": 77.2090, "name": "Delhi"},
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "name": "Mumbai"},
    "kolkata": {"lat": 22.5726, "lon": 88.3639, "name": "Kolkata"},
    "chennai": {"lat": 13.0827, "lon": 80.2707, "name": "Chennai"},
    "bengaluru": {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru"},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "name": "Hyderabad"},
    "beijing": {"lat": 39.9042, "lon": 116.4074, "name": "Beijing"},
    "london": {"lat": 51.5074, "lon": -0.1278, "name": "London"},
    "new york": {"lat": 40.7128, "lon": -74.0060, "name": "New York"},
    "tokyo": {"lat": 35.6762, "lon": 139.6503, "name": "Tokyo"},
    "paris": {"lat": 48.8566, "lon": 2.3522, "name": "Paris"},
    "dubai": {"lat": 25.2048, "lon": 55.2708, "name": "Dubai"},
}

def get_aqi_category(aqi_val: int) -> str:
    if aqi_val <= 50:
        return "Good"
    elif aqi_val <= 100:
        return "Moderate"
    elif aqi_val <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi_val <= 200:
        return "Unhealthy"
    elif aqi_val <= 300:
        return "Very Unhealthy"
    else:
        return "Severe"

def get_weather(city: str) -> Optional[WeatherInfo]:
    """Fetch live weather metrics from Open-Meteo or OpenWeatherMap."""
    city_lower = city.strip().lower()
    coords = CITY_COORDINATES.get(city_lower)
    
    # Attempt OpenWeatherMap if valid key exists
    if settings.WEATHER_API_KEY and not settings.WEATHER_API_KEY.startswith("<"):
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={settings.WEATHER_API_KEY}&units=metric"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                return WeatherInfo(
                    temperature_c=data["main"]["temp"],
                    humidity_pct=data["main"]["humidity"],
                    wind_speed_ms=data["wind"]["speed"],
                    description=data["weather"][0]["description"].capitalize()
                )
        except Exception as e:
            print(f"[WeatherService] OpenWeatherMap failed: {e}")

    # Fallback to Open-Meteo Weather API (Free, keyless)
    if coords:
        lat, lon = coords["lat"], coords["lon"]
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                cur = res.json().get("current", {})
                return WeatherInfo(
                    temperature_c=cur.get("temperature_2m", 25.0),
                    humidity_pct=cur.get("relative_humidity_2m", 60),
                    wind_speed_ms=cur.get("wind_speed_10m", 3.0),
                    description="Live Weather Telemetry"
                )
        except Exception as e:
            print(f"[WeatherService] Open-Meteo weather failed: {e}")
            
    return None

def get_live_city_aqi(city: str, waqi_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch real-time live AQI & criteria pollutant metrics for a city.
    Tries WAQI -> OpenWeatherMap -> Open-Meteo Air Quality API (Free, Keyless).
    """
    city_clean = city.strip()
    city_lower = city_clean.lower()
    coords = CITY_COORDINATES.get(city_lower, {"lat": 28.6139, "lon": 77.2090, "name": city_clean})
    lat, lon = coords["lat"], coords["lon"]
    display_name = coords.get("name", city_clean)

    # 1. Try WAQI API if token provided
    token = waqi_token or getattr(settings, "WAQI_API_KEY", None)
    if token and not token.startswith("<"):
        try:
            url = f"https://api.waqi.info/feed/{city_clean}/?token={token}"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if data.get("status") == "ok":
                    rdata = data.get("data", {})
                    aqi_val = int(rdata.get("aqi", 100))
                    iaqi = rdata.get("iaqi", {})
                    pm25 = float(iaqi.get("pm25", {}).get("v", 35.0))
                    pm10 = float(iaqi.get("pm10", {}).get("v", 70.0))
                    dom = rdata.get("dominentpol", "pm25").upper()
                    
                    return {
                        "city": display_name,
                        "aqi": aqi_val,
                        "category": get_aqi_category(aqi_val),
                        "pm25": pm25,
                        "pm10": pm10,
                        "dominant": dom,
                        "source": "WAQI Ground Sensor Network",
                        "is_live": True
                    }
        except Exception as e:
            print(f"[WeatherService] WAQI error: {e}")

    # 2. Try Open-Meteo Air Quality & Weather API (Free, keyless)
    try:
        aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone"
        w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
        
        aq_res = requests.get(aq_url, timeout=5)
        w_res = requests.get(w_url, timeout=5)
        
        if aq_res.status_code == 200:
            aq_cur = aq_res.json().get("current", {})
            w_cur = w_res.json().get("current", {}) if w_res.status_code == 200 else {}
            
            us_aqi = int(aq_cur.get("us_aqi", 85))
            pm25 = round(float(aq_cur.get("pm2_5", 30.0)), 1)
            pm10 = round(float(aq_cur.get("pm10", 65.0)), 1)
            no2 = round(float(aq_cur.get("nitrogen_dioxide", 25.0)), 1)
            so2 = round(float(aq_cur.get("sulphur_dioxide", 10.0)), 1)
            co = round(float(aq_cur.get("carbon_monoxide", 400.0)), 1)
            o3 = round(float(aq_cur.get("ozone", 45.0)), 1)
            
            # Dominant pollutant heuristic
            dom = "PM2.5" if pm25 > 35 else "PM10" if pm10 > 70 else "NO2"
            
            temp_c = round(float(w_cur.get("temperature_2m", 26.5)), 1)
            hum_pct = int(w_cur.get("relative_humidity_2m", 60))
            wind_ms = round(float(w_cur.get("wind_speed_10m", 3.2)), 1)
            
            return {
                "city": display_name,
                "aqi": us_aqi,
                "category": get_aqi_category(us_aqi),
                "pm25": pm25,
                "pm10": pm10,
                "no2": no2,
                "so2": so2,
                "co": co,
                "o3": o3,
                "dominant": dom,
                "temp": f"{temp_c}°C",
                "humidity": f"{hum_pct}%",
                "wind": f"{wind_ms} m/s",
                "source": "Open-Meteo Satellite & CAMS Telemetry (Live)",
                "is_live": True
            }
    except Exception as e:
        print(f"[WeatherService] Open-Meteo AQI error: {e}")

    # Fallback default object
    return {
        "city": display_name,
        "aqi": 88,
        "category": "Moderate",
        "pm25": 30.0,
        "pm10": 60.0,
        "dominant": "PM2.5",
        "temp": "28.0°C",
        "humidity": "65%",
        "wind": "3.0 m/s",
        "source": "Simulated Telemetry",
        "is_live": False
    }
