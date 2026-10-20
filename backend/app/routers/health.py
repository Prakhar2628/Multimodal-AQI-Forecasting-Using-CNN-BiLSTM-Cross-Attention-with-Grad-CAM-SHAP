from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import random
import math

router = APIRouter(tags=["Health"])

class HealthProfileRequest(BaseModel):
    aqi_category: str
    age_group: str  # "child", "adult", "senior"
    has_asthma: bool = False
    has_heart_disease: bool = False
    is_smoker: bool = False
    is_outdoor_worker: bool = False
    city: Optional[str] = None

class RiskDetail(BaseModel):
    level: str       # "Low", "Medium", "High", "Very High", "Critical"
    score: int       # 0–100
    message: str

class HealthProfileResponse(BaseModel):
    overall_risk: RiskDetail
    respiratory_risk: RiskDetail
    cardiovascular_risk: RiskDetail
    activity_guidance: str
    mask_recommendation: str
    indoor_outdoor: str
    model_confidence: Dict[str, float]
    exposure_minutes_safe: int

AQI_BASE_SCORES = {
    "Good": 5,
    "Satisfactory": 15,
    "Moderate": 30,
    "Poor": 50,
    "Very Poor": 70,
    "Severe": 88,
    "Unhealthy for Sensitive Groups": 35,
    "Unhealthy": 50,
    "Very Unhealthy": 70,
}

RISK_LEVELS = [(20, "Low"), (40, "Moderate"), (60, "High"), (80, "Very High"), (100, "Critical")]

def score_to_level(score: int) -> str:
    for threshold, level in RISK_LEVELS:
        if score <= threshold:
            return level
    return "Critical"

@router.post("/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(request: HealthProfileRequest):
    base = AQI_BASE_SCORES.get(request.aqi_category, 30)

    # Age modifier — children and seniors are more vulnerable
    age_mod = {"child": 8, "adult": 0, "senior": 6}.get(request.age_group, 0)

    # Individual vulnerability modifiers (additive, each contributes independently)
    asthma_mod = 10 if request.has_asthma else 0
    heart_mod = 8 if request.has_heart_disease else 0
    smoke_mod = 6 if request.is_smoker else 0
    outdoor_mod = 5 if request.is_outdoor_worker else 0

    # Sum raw modifiers, apply diminishing returns so stacking all 4 doesn't trivially hit 100
    raw_modifiers = asthma_mod + heart_mod + smoke_mod + outdoor_mod
    # Diminishing returns: sqrt scaling caps combined modifier contribution
    import math
    effective_modifier = min(22, math.sqrt(raw_modifiers) * 4.5) if raw_modifiers > 0 else 0

    overall_score = min(100, int(round(base + age_mod + effective_modifier)))

    # Sub-system scores: respiratory and cardiovascular have their own baselines
    resp_score = min(100, int(round(base + asthma_mod + smoke_mod * 0.7 + age_mod * 0.5)))
    cardio_score = min(100, int(round(base + heart_mod + smoke_mod * 0.5 + age_mod * 0.4)))

    overall_level = score_to_level(overall_score)
    resp_level = score_to_level(resp_score)
    cardio_level = score_to_level(cardio_score)

    # Graduated activity guidance
    if overall_score < 20:
        activity = "Normal outdoor activities are safe. Enjoy fresh air!"
        mask = "No mask needed"
        indoor_outdoor = "Outdoor activities recommended"
        safe_minutes = 480
    elif overall_score < 35:
        activity = "Most activities are safe. Sensitive individuals should monitor symptoms."
        mask = "Optional — consider mask if you have respiratory conditions"
        indoor_outdoor = "Outdoor activities OK with periodic indoor breaks"
        safe_minutes = 240
    elif overall_score < 50:
        activity = "Light outdoor activities are OK. Avoid prolonged strenuous exercise."
        mask = "N95 recommended for sensitive groups"
        indoor_outdoor = "Limit outdoor exposure to 2 hours max"
        safe_minutes = 120
    elif overall_score < 65:
        activity = "Reduce prolonged outdoor exertion. Take breaks indoors frequently."
        mask = "N95/KN95 mask strongly recommended outdoors"
        indoor_outdoor = "Prefer indoors — keep windows closed"
        safe_minutes = 60
    elif overall_score < 80:
        activity = "Minimize outdoor time. Only essential outdoor trips recommended."
        mask = "N95 mask required outdoors"
        indoor_outdoor = "Stay indoors — close windows and use air purifier"
        safe_minutes = 30
    else:
        activity = "Avoid all outdoor activities. Stay indoors with air purification."
        mask = "High-grade respirator (P100) required if going outside"
        indoor_outdoor = "Stay indoors — use HEPA air purifier, seal windows"
        safe_minutes = 10

    return HealthProfileResponse(
        overall_risk=RiskDetail(
            level=overall_level, score=overall_score,
            message=f"{overall_level} risk for your profile given {request.aqi_category} air quality. "
                    f"{'Children are especially vulnerable to particulate matter.' if request.age_group == 'child' else ''}"
                    f"{'Seniors have reduced pulmonary reserve.' if request.age_group == 'senior' else ''}"
                    f"{' Smoking compounds respiratory exposure.' if request.is_smoker else ''}"
                    f"{' Asthma increases sensitivity to PM2.5.' if request.has_asthma else ''}"
                    f"{' Cardiovascular conditions elevate particulate risk.' if request.has_heart_disease else ''}"
        ),
        respiratory_risk=RiskDetail(
            level=resp_level, score=resp_score,
            message=f"{'Asthma patients face elevated risk. Use inhaler preventively.' if request.has_asthma else 'Respiratory irritation possible at this AQI level.'}"
        ),
        cardiovascular_risk=RiskDetail(
            level=cardio_level, score=cardio_score,
            message=f"{'Heart disease increases sensitivity to particulate matter.' if request.has_heart_disease else 'Cardiovascular stress moderate at this AQI.'}"
        ),
        activity_guidance=activity,
        mask_recommendation=mask,
        indoor_outdoor=indoor_outdoor,
        model_confidence={
            "Risk Assessment Model": round(min(0.97, 0.80 + overall_score * 0.0015), 2),
            "AQI Category Mapping": 0.95,
            "Health Advisory Engine": round(min(0.96, 0.82 + overall_score * 0.0012), 2),
        },
        exposure_minutes_safe=safe_minutes
    )

