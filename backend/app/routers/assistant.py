import os
import json
import time
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.config import settings
from app.services.weather_service import get_live_city_aqi, STABLE_CITY_AQI_BASELINE, CITY_COORDINATES

router = APIRouter(tags=["AI Assistant"])

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    city: Optional[str] = "Delhi"

class ChatResponse(BaseModel):
    reply: str
    city: str
    telemetry: Optional[Dict[str, Any]] = None

def detect_city(text: str, default_city: str = "Delhi") -> str:
    """Detect if a user mentioned a specific Indian city in their message."""
    text_lower = text.lower()
    for c_key in CITY_COORDINATES.keys():
        if c_key in text_lower:
            return CITY_COORDINATES[c_key]["name"]
    for c_name in STABLE_CITY_AQI_BASELINE.keys():
        if c_name.lower() in text_lower:
            return c_name
    return default_city or "Delhi"

@router.post("/chat", response_model=ChatResponse)
async def chat_assistant(req: ChatRequest):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Detect target city from query or fallback to request city
    target_city = detect_city(user_msg, default_city=req.city or "Delhi")
    
    # 2. Retrieve real-time telemetry for this city
    telemetry = get_live_city_aqi(target_city)

    # Calculate rain likelihood heuristics based on humidity & atmospheric conditions
    try:
        hum_num = float(str(telemetry.get("humidity", "55")).replace("%", "").strip())
    except Exception:
        hum_num = 55.0

    temp_str = telemetry.get("temp", "24°C")
    wind_str = telemetry.get("wind", "2.5 m/s")
    aqi_num = telemetry.get("aqi", 150)
    category = telemetry.get("category", "Moderate")
    pm25 = telemetry.get("pm25", 60.0)
    pm10 = telemetry.get("pm10", 110.0)

    # Rain probability estimation based on atmospheric physics:
    # High humidity (>70%) with moderate/cool temps increases rain probability
    if hum_num >= 80:
        rain_prob = "High (70-85% chance)"
        rain_status = "Rain or light drizzle is highly probable in the next few hours with overcast cloud cover."
    elif hum_num >= 65:
        rain_prob = "Moderate (40-60% chance)"
        rain_status = "Atmospheric moisture is elevated; scattered drizzle or passing cloud showers may occur later today."
    elif hum_num >= 50:
        rain_prob = "Low (15-25% chance)"
        rain_status = "Generally dry with isolated passing cloud patches; significant rainfall is unlikely in the immediate next few hours."
    else:
        rain_prob = "Very Low (<10% chance)"
        rain_status = "Dry atmosphere with clear/hazy conditions; no rain anticipated over the next few hours."

    telemetry_summary = (
        f"City: {target_city}\n"
        f"Temperature: {temp_str}\n"
        f"Humidity: {hum_num:.0f}%\n"
        f"Wind Speed: {wind_str}\n"
        f"Rain Probability: {rain_prob} ({rain_status})\n"
        f"AQI: {aqi_num} ({category})\n"
        f"PM2.5: {pm25} µg/m³, PM10: {pm10} µg/m³\n"
    )

    # 3. Call Groq LLM if key is configured
    groq_key = getattr(settings, "GROQ_API_KEY", "") or os.getenv("GROQ_API_KEY", "")
    
    system_prompt = (
        "You are 'Aero', an intelligent real-time AI Atmospheric & Air Quality Assistant for the AQI Multimodal platform. "
        "You provide accurate, concise, helpful, and friendly answers about weather, rain forecasts, humidity, temperature, "
        "AQI, pollutant levels, health advisories (masks, outdoor exercise), and model explainability (Grad-CAM, SHAP, LIME).\n\n"
        f"CURRENT REAL-TIME ATMOSPHERIC TELEMETRY FOR {target_city.upper()}:\n"
        f"{telemetry_summary}\n"
        "Guidelines:\n"
        "1. When asked about weather, rain, humidity, or temperature, cite the exact real telemetry provided above.\n"
        "2. When asked about rain in the next few hours, explain the rain probability and cloud/humidity conditions.\n"
        "3. Keep responses conversational, concise (2-4 paragraphs max), and format with clear bullet points and emojis where helpful.\n"
        "4. Always offer practical health advice if AQI is Poor or worse (e.g. N95 mask, avoid heavy outdoor exertion)."
    )

    reply_text = None
    if groq_key:
        try:
            messages = [{"role": "system", "content": system_prompt}]
            # Include recent conversation turns for context
            if req.history:
                for h in req.history[-4:]:
                    messages.append({"role": h.role, "content": h.content})
            messages.append({"role": "user", "content": user_msg})

            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.4,
                "max_tokens": 450
            }
            resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                reply_text = data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[AIAssistant] Groq call error: {e}, falling back to rule-based engine", flush=True)

    # 4. Fallback intelligent contextual response if Groq is unavailable
    if not reply_text:
        msg_lower = user_msg.lower()
        if "rain" in msg_lower:
            reply_text = (
                f"🌧️ **Rain Forecast for {target_city}**\n\n"
                f"- **Current Humidity:** {hum_num:.0f}%\n"
                f"- **Rain Probability:** {rain_prob}\n"
                f"- **Forecast Note:** {rain_status}\n\n"
                f"Currently, {target_city} has a temperature of **{temp_str}** with wind speeds around **{wind_str}**."
            )
        elif "humid" in msg_lower or "weather" in msg_lower or "temp" in msg_lower:
            reply_text = (
                f"🌤️ **Weather & Atmospheric Report for {target_city}**\n\n"
                f"- **Temperature:** {temp_str}\n"
                f"- **Relative Humidity:** {hum_num:.0f}%\n"
                f"- **Wind Speed:** {wind_str}\n"
                f"- **Rain Probability:** {rain_prob}\n"
                f"- **Air Quality Index:** {aqi_num} ({category})\n\n"
                f"{'High humidity with gentle winds can trap airborne particulates.' if hum_num > 60 else 'Conditions are relatively dry and stable.'}"
            )
        elif "aqi" in msg_lower or "pollution" in msg_lower or "pm" in msg_lower:
            reply_text = (
                f"🌫️ **Air Quality Report for {target_city}**\n\n"
                f"- **Overall AQI:** {aqi_num} ({category})\n"
                f"- **PM2.5:** {pm25} µg/m³\n"
                f"- **PM10:** {pm10} µg/m³\n"
                f"- **Dominant Pollutant:** {telemetry.get('dominant', 'PM2.5')}\n\n"
                f"**Health Recommendation:** {'Sensitive individuals should wear N95 masks and limit prolonged outdoor activity.' if aqi_num > 150 else 'Air quality is within acceptable limits for general outdoor activity.'}"
            )
        else:
            reply_text = (
                f"Hello! I'm **Aero**, your real-time atmospheric and air quality assistant.\n\n"
                f"Right now in **{target_city}**:\n"
                f"- **Temperature:** {temp_str}\n"
                f"- **Humidity:** {hum_num:.0f}%\n"
                f"- **Rain Chance:** {rain_prob}\n"
                f"- **Air Quality:** {aqi_num} ({category})\n\n"
                f"Feel free to ask me questions like *'Will it rain in Delhi in the next few hours?'*, *'What is the humidity in Mumbai?'*, or *'Is it safe to run outside?'*!"
            )

    return {
        "reply": reply_text,
        "city": target_city,
        "telemetry": telemetry
    }
