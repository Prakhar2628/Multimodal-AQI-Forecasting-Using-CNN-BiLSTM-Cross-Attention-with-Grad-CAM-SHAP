from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from app.services.model_service import load_model_artifacts
from app.services.health_service import seed_health_risk_reference
from app.database import init_db, AsyncSessionLocal
from app.config import settings
import app.routers.predict as predict
import app.routers.predictions as predictions
import app.routers.readings as readings
import app.routers.cities as cities
import app.routers.weather as weather
import app.routers.explain as explain
import app.routers.health as health
import app.routers.forecast as forecast
import app.routers.assistant as assistant

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and seed data
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_health_risk_reference(db)
        
    # Load ML artifacts once at startup
    load_model_artifacts()
    yield

app = FastAPI(title="AQI Multimodal Prediction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=settings.CORS_ORIGINS, 
    allow_origin_regex=r"https?://.*",
    allow_methods=["*"], 
    allow_headers=["*"],
    allow_credentials=True,
)

# Serve uploaded images as static files
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(predict.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(readings.router, prefix="/api")
app.include_router(cities.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")

@app.get("/api/health-check")
async def health_check():
    return {"status": "ok", "version": "2.0"}
