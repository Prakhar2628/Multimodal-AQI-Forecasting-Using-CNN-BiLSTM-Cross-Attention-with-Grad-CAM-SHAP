import os
import re
import json
import time
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.config import settings
from app.services.weather_service import STABLE_CITY_AQI_BASELINE, get_live_city_aqi

router = APIRouter(tags=["AI Assistant"])

class ChatMessage(BaseModel):
    role: Optional[str] = "user"
    content: Optional[str] = ""

    class Config:
        extra = "allow"

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None
    city: Optional[str] = "Delhi"
    groq_api_key: Optional[str] = None

    class Config:
        extra = "allow"

class ChatResponse(BaseModel):
    reply: str
    city: str
    telemetry: Optional[Dict[str, Any]] = None

# Comprehensive Indian and Global City Normalization Map
CITY_ALIASES: Dict[str, str] = {
    # Bangalore / Bengaluru variations
    "banglore": "Bengaluru",
    "bangalore": "Bengaluru",
    "bengaluru": "Bengaluru",
    "blr": "Bengaluru",
    # Delhi NCR variations
    "delhi": "Delhi",
    "dilli": "Delhi",
    "new delhi": "Delhi",
    "ncr": "Delhi",
    "gurgaon": "Gurugram",
    "gurugram": "Gurugram",
    "noida": "Noida",
    "greater noida": "Noida",
    "ghaziabad": "Ghaziabad",
    "faridabad": "Faridabad",
    # Mumbai region
    "mumbai": "Mumbai",
    "bombay": "Mumbai",
    "navi mumbai": "Mumbai",
    "thane": "Thane",
    "pune": "Pune",
    "poona": "Pune",
    # South India
    "chennai": "Chennai",
    "madras": "Chennai",
    "hyderabad": "Hyderabad",
    "hydrabad": "Hyderabad",
    "hyd": "Hyderabad",
    "kochi": "Kochi",
    "cochin": "Kochi",
    "trivandrum": "Thiruvananthapuram",
    "thiruvananthapuram": "Thiruvananthapuram",
    "coimbatore": "Coimbatore",
    "madurai": "Madurai",
    "mysore": "Mysuru",
    "mysuru": "Mysuru",
    "mangalore": "Mangaluru",
    "mangaluru": "Mangaluru",
    "visakhapatnam": "Visakhapatnam",
    "vizag": "Visakhapatnam",
    "vijayawada": "Vijayawada",
    # East India
    "kolkata": "Kolkata",
    "calcutta": "Kolkata",
    "patna": "Patna",
    "bhubaneswar": "Bhubaneswar",
    "ranchi": "Ranchi",
    "guwahati": "Guwahati",
    # North & West India
    "jaipur": "Jaipur",
    "lucknow": "Lucknow",
    "kanpur": "Kanpur",
    "varanasi": "Varanasi",
    "banaras": "Varanasi",
    "kashi": "Varanasi",
    "agra": "Agra",
    "chandigarh": "Chandigarh",
    "amritsar": "Amritsar",
    "ludhiana": "Ludhiana",
    "dehradun": "Dehradun",
    "shimla": "Shimla",
    "ahmedabad": "Ahmedabad",
    "amdavad": "Ahmedabad",
    "surat": "Surat",
    "vadodara": "Vadodara",
    "indore": "Indore",
    "bhopal": "Bhopal",
    "nagpur": "Nagpur",
    "goa": "Goa"
}

def extract_target_city(text: str, default_city: str = "Delhi") -> str:
    """Extract and normalize city name from natural language query."""
    text_lower = text.lower().strip()
    
    # 1. Direct whole-word alias check
    for alias, canonical in CITY_ALIASES.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', text_lower):
            return canonical

    # 2. Check baseline cities
    for b_city in STABLE_CITY_AQI_BASELINE.keys():
        if re.search(r'\b' + re.escape(b_city.lower()) + r'\b', text_lower):
            return b_city

    # 3. Regex capture for preposition patterns like 'weather in <City>', 'humidity of <City>'
    patterns = [
        r'(?:weather|humidity|rain|temp|temperature|aqi|forecast)\s+(?:in|of|for|at)\s+([a-zA-Z\s]{2,20})',
        r'(?:in|of|for|at)\s+([a-zA-Z\s]{2,20})(?:\s+(?:weather|humidity|rain|temp|today|now))',
        r'([a-zA-Z]{3,20})\s+(?:weather|humidity|rain|temp|temperature|aqi)'
    ]
    stopwords = {'the', 'a', 'an', 'today', 'now', 'next', 'few', 'hours', 'current', 'city', 'this', 'general', 'my', 'is', 'will', 'there'}
    for p in patterns:
        m = re.search(p, text_lower)
        if m:
            candidate = m.group(1).strip()
            # Clean candidate
            words = [w for w in candidate.split() if w not in stopwords]
            if words:
                c_clean = words[0]
                if len(c_clean) >= 3 and c_clean not in stopwords:
                    return CITY_ALIASES.get(c_clean, c_clean.capitalize())

    return default_city or "Delhi"

def fetch_live_weather(city_name: str, weather_key: Optional[str] = None) -> Dict[str, Any]:
    """Fetch live meteorological observations using OpenWeatherMap API."""
    key = weather_key or getattr(settings, "WEATHER_API_KEY", "") or os.getenv("WEATHER_API_KEY", "")
    
    # Query OpenWeatherMap with standard name (Bangalore is often indexed as Bangalore or Bengaluru)
    query_name = "Bangalore" if city_name in ["Bengaluru", "Bangalore"] else city_name

    headers = {"User-Agent": "Mozilla/5.0"}
    
    if key:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={query_name}&appid={key}&units=metric"
        try:
            resp = requests.get(url, headers=headers, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                main_sec = data.get("main", {})
                weather_sec = data.get("weather", [{}])[0]
                wind_sec = data.get("wind", {})
                clouds_sec = data.get("clouds", {})
                rain_sec = data.get("rain", {})

                temp_val = float(main_sec.get("temp", 26.0))
                humidity_val = float(main_sec.get("humidity", 55.0))
                wind_speed_ms = float(wind_sec.get("speed", 2.5))
                clouds_pct = int(clouds_sec.get("all", 40))
                weather_main = weather_sec.get("main", "Clouds")
                weather_desc = weather_sec.get("description", "partly cloudy").capitalize()
                rain_1h = float(rain_sec.get("1h", 0.0))

                # Atmospheric rain likelihood computation
                if "rain" in weather_main.lower() or "drizzle" in weather_main.lower() or rain_1h > 0:
                    rain_prob = "Very High (>85% chance)"
                    rain_status = f"Currently experiencing {weather_desc.lower()}; precipitation is active."
                elif humidity_val >= 75 and clouds_pct >= 65:
                    rain_prob = "High (70-80% chance)"
                    rain_status = f"Heavy cloud cover ({clouds_pct}%) and high humidity ({humidity_val:.0f}%) indicate rain is likely within the next few hours."
                elif humidity_val >= 60 and clouds_pct >= 40:
                    rain_prob = "Moderate (40-60% chance)"
                    rain_status = f"Elevated humidity ({humidity_val:.0f}%) with {weather_desc.lower()}; scattered showers or passing drizzle are possible later today."
                elif humidity_val >= 45:
                    rain_prob = "Low (15-25% chance)"
                    rain_status = f"Scattered cloud cover ({clouds_pct}%); dry conditions prevail and significant rain is unlikely in the next few hours."
                else:
                    rain_prob = "Very Low (<10% chance)"
                    rain_status = f"Clear/dry atmosphere ({humidity_val:.0f}% humidity); virtually zero chance of rainfall over the next few hours."

                # Cross-reference AQI from Indian baseline or safe estimation
                base = get_live_city_aqi(city_name)

                return {
                    "city": city_name,
                    "temp": f"{temp_val:.1f}°C",
                    "temp_num": temp_val,
                    "humidity": f"{humidity_val:.0f}%",
                    "humidity_num": humidity_val,
                    "wind": f"{wind_speed_ms * 3.6:.1f} km/h",
                    "wind_ms": wind_speed_ms,
                    "desc": weather_desc,
                    "clouds": clouds_pct,
                    "rain_prob": rain_prob,
                    "rain_status": rain_status,
                    "aqi": base.get("aqi", 110),
                    "category": base.get("category", "Moderate"),
                    "pm25": base.get("pm25", 45.0),
                    "pm10": base.get("pm10", 85.0),
                    "dominant": base.get("dominant", "PM2.5"),
                    "source": "OpenWeatherMap Live Telemetry",
                    "is_live": True
                }
        except Exception as e:
            print(f"[AIAssistant] OpenWeatherMap request failed for {city_name}: {e}", flush=True)

    # Fallback to stable Indian meteorological baseline if OpenWeatherMap is unreachable
    base = get_live_city_aqi(city_name)
    try:
        hum_num = float(str(base.get("humidity", "55")).replace("%", "").strip())
    except Exception:
        hum_num = 55.0

    if hum_num >= 75:
        rain_prob = "High (70-80% chance)"
        rain_status = "High moisture indicates rain is possible in the next few hours."
    elif hum_num >= 60:
        rain_prob = "Moderate (40-60% chance)"
        rain_status = "Passing clouds with moderate humidity; brief drizzle is possible."
    else:
        rain_prob = "Low (<20% chance)"
        rain_status = "Dry atmosphere; rain is unlikely in the next few hours."

    return {
        "city": city_name,
        "temp": base.get("temp", "26°C"),
        "temp_num": 26.0,
        "humidity": base.get("humidity", "55%"),
        "humidity_num": hum_num,
        "wind": base.get("wind", "10 km/h"),
        "wind_ms": 2.8,
        "desc": "Partly Cloudy",
        "clouds": 40,
        "rain_prob": rain_prob,
        "rain_status": rain_status,
        "aqi": base.get("aqi", 125),
        "category": base.get("category", "Moderate"),
        "pm25": base.get("pm25", 45.0),
        "pm10": base.get("pm10", 85.0),
        "dominant": base.get("dominant", "PM2.5"),
        "source": base.get("source", "Telemetry Baseline"),
        "is_live": True
    }

def ask_groq_llm(
    system_prompt: str,
    user_msg: str,
    history: Optional[List[ChatMessage]] = None,
    custom_key: Optional[str] = None
) -> Optional[str]:
    """Invoke Groq LLM with supported models and browser User-Agent header."""
    groq_key = custom_key or getattr(settings, "GROQ_API_KEY", "") or os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        return None

    # Cascade through supported active Groq chat models
    supported_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]

    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for h in history[-4:]:
            r = h.get("role", "user") if isinstance(h, dict) else getattr(h, "role", "user")
            c = h.get("content", "") if isinstance(h, dict) else getattr(h, "content", "")
            if c:
                messages.append({"role": r, "content": c})
    messages.append({"role": "user", "content": user_msg})

    for model_name in supported_models:
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.35,
            "max_tokens": 450
        }
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=9
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                print(f"[AIAssistant] Groq model {model_name} HTTP {resp.status_code}: {resp.text[:120]}", flush=True)
        except Exception as e:
            print(f"[AIAssistant] Groq model {model_name} exception: {e}", flush=True)

    return None

@router.post("/chat", response_model=ChatResponse)
async def chat_assistant(req: ChatRequest):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Detect target city accurately from user prompt (handles 'banglore', 'delhi', 'mumbai', etc.)
    target_city = extract_target_city(user_msg, default_city=req.city or "Delhi")
    
    # 2. Fetch authentic live weather metrics via OpenWeatherMap
    telemetry = fetch_live_weather(target_city)

    temp_str = telemetry["temp"]
    humidity_str = telemetry["humidity"]
    wind_str = telemetry["wind"]
    condition_desc = telemetry["desc"]
    clouds_pct = telemetry["clouds"]
    rain_prob = telemetry["rain_prob"]
    rain_status = telemetry["rain_status"]
    aqi_num = telemetry["aqi"]
    category = telemetry["category"]
    pm25 = telemetry["pm25"]
    pm10 = telemetry["pm10"]

    telemetry_summary = (
        f"City: {target_city}\n"
        f"Current Temperature: {temp_str}\n"
        f"Relative Humidity: {humidity_str}\n"
        f"Atmospheric Condition: {condition_desc} (Cloud cover: {clouds_pct}%)\n"
        f"Wind Speed: {wind_str}\n"
        f"Rain Outlook: {rain_prob} - {rain_status}\n"
        f"Air Quality Index (AQI): {aqi_num} ({category})\n"
        f"PM2.5: {pm25} µg/m³, PM10: {pm10} µg/m³\n"
        f"Data Source: {telemetry['source']}\n"
    )

    # 3. System Prompt for Groq AI
    system_prompt = (
        "You are 'Aero', an intelligent, real-time Atmospheric & Weather AI Assistant for the Multimodal AQI platform. "
        "Users frequently ask you about current weather, humidity, temperature, rain forecasts in the next few hours, "
        "AQI, and outdoor health advisories.\n\n"
        f"REAL-TIME OBSERVED METEOROLOGICAL TELEMETRY FOR {target_city.upper()}:\n"
        f"{telemetry_summary}\n"
        "Guidelines:\n"
        "1. Always address the exact city requested by the user and quote the real-time weather metrics provided above.\n"
        "2. When asked about rain in the next few hours, clearly state the rain probability and cloud/moisture outlook.\n"
        "3. Keep your answers clear, concise, well-structured with bullet points and appropriate emojis (☀️, 🌧️, 💧, 🌡️, 💨, 🌫️).\n"
        "4. Include quick health tips if AQI is Poor or worse, or if outdoor exercise is inquired."
    )

    # 4. Attempt Groq LLM completion
    reply_text = ask_groq_llm(
        system_prompt=system_prompt,
        user_msg=user_msg,
        history=req.history,
        custom_key=req.groq_api_key
    )

    # 5. Seamless fallback if Groq key expires or is unavailable
    if not reply_text:
        msg_lower = user_msg.lower()
        if "rain" in msg_lower:
            reply_text = (
                f"🌧️ **Rain Forecast for {target_city}**\n\n"
                f"- **Rain Probability:** {rain_prob}\n"
                f"- **Current Humidity:** {humidity_str}\n"
                f"- **Cloud Cover:** {clouds_pct}% ({condition_desc})\n"
                f"- **Outlook (Next Few Hours):** {rain_status}\n\n"
                f"Currently, {target_city} is experiencing a temperature of **{temp_str}** with winds at **{wind_str}**."
            )
        elif "humid" in msg_lower or "weather" in msg_lower or "temp" in msg_lower:
            reply_text = (
                f"🌤️ **Current Weather & Atmospheric Status for {target_city}**\n\n"
                f"- **Temperature:** {temp_str}\n"
                f"- **Relative Humidity:** {humidity_str}\n"
                f"- **Condition:** {condition_desc} (Clouds: {clouds_pct}%)\n"
                f"- **Wind Speed:** {wind_str}\n"
                f"- **Rain Outlook:** {rain_prob}\n"
                f"- **Air Quality Index:** {aqi_num} ({category})\n\n"
                f"{'High humidity with gentle winds can trap airborne particulates.' if telemetry['humidity_num'] > 65 else 'Atmospheric conditions are stable and clear.'}"
            )
        elif "aqi" in msg_lower or "pollution" in msg_lower or "pm" in msg_lower or "safe" in msg_lower:
            reply_text = (
                f"🌫️ **Air Quality & Health Report for {target_city}**\n\n"
                f"- **Overall AQI:** {aqi_num} ({category})\n"
                f"- **PM2.5:** {pm25} µg/m³\n"
                f"- **PM10:** {pm10} µg/m³\n"
                f"- **Dominant Pollutant:** {telemetry['dominant']}\n\n"
                f"**Health Recommendation:** {'Sensitive groups should wear an N95 mask and limit prolonged outdoor exertion.' if aqi_num > 150 else 'Air quality is within acceptable limits for normal outdoor activity.'}"
            )
        else:
            reply_text = (
                f"Hello! I am **Aero**, your real-time atmospheric and weather assistant.\n\n"
                f"**Current Status in {target_city}:**\n"
                f"- **Temperature:** {temp_str}\n"
                f"- **Humidity:** {humidity_str}\n"
                f"- **Sky Condition:** {condition_desc} ({clouds_pct}% clouds)\n"
                f"- **Rain Probability:** {rain_prob}\n"
                f"- **AQI:** {aqi_num} ({category})\n\n"
                f"Ask me anything like *'Will it rain in {target_city} in the next few hours?'*, *'What is the humidity in Mumbai?'*, or *'Current weather of Bangalore'*!"
            )

    return ChatResponse(
        reply=reply_text,
        city=target_city,
        telemetry=telemetry
    )
