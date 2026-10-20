from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    WEATHER_API_KEY: str
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    MODEL_ARTIFACTS_DIR: str = "app/ml_artifacts"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
