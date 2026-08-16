from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import json
import os
import uuid
from pathlib import Path
from datetime import date

from app.database import get_db
from app.schemas.prediction import PredictionResponse, PredictionCreate, HealthAdvisory
from app.schemas.reading import PollutantReading
from app.crud.predictions import create_prediction
from app.services.model_service import predict
from app.services.weather_service import get_weather
from app.services.health_service import get_health_advisory

router = APIRouter(tags=["Predict"])

# Ensure uploads directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/predict", response_model=PredictionResponse)
async def predict_aqi(
    image: UploadFile = File(...),
    readings: str = Form(...), # JSON string array of 14 readings
    city: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        readings_data = json.loads(readings)
        pollutant_readings = [PollutantReading(**r) for r in readings_data]
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid readings format: {e}")

    # 1. Read image bytes
    image_bytes = await image.read()

    # 2. Save image to uploads/ directory with a unique name
    ext = Path(image.filename).suffix if image.filename else ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name
    try:
        with open(save_path, "wb") as f:
            f.write(image_bytes)
    except Exception as e:
        # Non-fatal: continue even if save fails
        unique_name = image.filename or "uploaded_image.jpg"

    image_path = f"uploads/{unique_name}"

    # 3. Run inference — pass save_path so model can open via file path (avoids AVIF/BytesIO bugs)
    try:
        result = predict(image_bytes, pollutant_readings, image_path=str(save_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    # 4. Get Weather
    weather_info = None
    if city:
        weather_info = get_weather(city)

    # 5. Get Health Advisory
    advisory_dict = await get_health_advisory(db, result["predicted_category"])
    if not advisory_dict:
        advisory_dict = {
            "risk": "Unknown", "asthma_risk": "Unknown",
            "outdoor_exercise": "Unknown", "mask": "Unknown", "children": "Unknown"
        }
        
    # Apply weather rule-based enrichment
    if weather_info and weather_info.humidity_pct > 70 and weather_info.wind_speed_ms < 2:
        advisory_dict["risk"] += " (Weather note: Low wind and high humidity may trap pollutants.)"

    health_advisory = HealthAdvisory(**advisory_dict)

    # 6. Save Prediction to DB
    pred_in = PredictionCreate(
        city=city,
        image_path=image_path,
        predicted_category=result["predicted_category"],
        confidence=result["confidence"],
        all_probabilities=result["all_probabilities"],
        health_advisory=health_advisory,
        weather=weather_info,
        readings=pollutant_readings
    )
    
    db_prediction = await create_prediction(db, pred_in)
    return db_prediction
