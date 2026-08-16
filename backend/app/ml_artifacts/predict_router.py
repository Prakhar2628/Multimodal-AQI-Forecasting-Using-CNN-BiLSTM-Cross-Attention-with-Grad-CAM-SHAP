"""
predict_router.py

FastAPI routes for AQI prediction. Drop into backend/app/routers/predict.py
and include it in your main app:

    from app.routers import predict as predict_router
    app.include_router(predict_router.router, prefix="/predict", tags=["predict"])

Also add to your app startup (e.g. in main.py's lifespan/startup event):

    from app.services.model_service import AQIModelService
    app.state.aqi_service = AQIModelService(artifacts_dir="app/ml_artifacts")

and adjust the `get_service` dependency below to match how you store it
(this example assumes it's on app.state, a common FastAPI pattern).
"""

import io
import json
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


def get_service(request: Request):
    service = getattr(request.app.state, "aqi_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="Model service not initialized")
    return service


class PollutantReading(BaseModel):
    date: str = Field(..., description="ISO date, e.g. '2026-08-01'")
    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float


class PredictionResponse(BaseModel):
    aqi_category: str
    confidence: float
    probabilities: dict
    mode: str
    risk: str
    asthma_risk: str
    outdoor_exercise: str
    mask: str
    children: str
    note: Optional[str] = None


async def _read_and_validate_image(image: UploadFile) -> bytes:
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{image.content_type}'. Allowed: {ALLOWED_IMAGE_TYPES}",
        )
    contents = await image.read()
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image upload")
    return contents


@router.post("/image", response_model=PredictionResponse)
async def predict_from_image_only(
    image: UploadFile = File(...),
    service=Depends(get_service),
):
    """
    Predict AQI category from a photo alone. Always available — the model
    was trained with modality dropout so it doesn't require sensor data.
    """
    contents = await _read_and_validate_image(image)
    try:
        result = service.predict_image_only(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")
    return result


@router.post("/full", response_model=PredictionResponse)
async def predict_multimodal(
    image: UploadFile = File(...),
    pollutant_history_json: str = Form(
        ..., description="JSON array of PollutantReading objects, most recent last, "
                          ">=21 daily rows recommended (14-day window + 7 days of lag context)"
    ),
    service=Depends(get_service),
):
    """
    Predict AQI category from a photo plus recent daily pollutant history
    for the same city/station. Falls back to image-only automatically if
    history is too short to build valid rolling/lag features.
    """
    contents = await _read_and_validate_image(image)

    try:
        readings = json.loads(pollutant_history_json)
        history_df = pd.DataFrame([PollutantReading(**r).dict() for r in readings])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid pollutant_history_json: {e}")

    try:
        result = service.predict_full(contents, history_df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")
    return result
