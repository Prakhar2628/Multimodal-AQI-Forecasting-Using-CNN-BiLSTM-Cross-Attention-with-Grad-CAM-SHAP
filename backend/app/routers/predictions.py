from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.schemas.prediction import PredictionListItem, PredictionResponse
from app.crud.predictions import list_predictions, get_prediction, delete_prediction
from fastapi import HTTPException

router = APIRouter(tags=["Predictions"])

@router.get("/predictions", response_model=List[PredictionListItem])
async def read_predictions(
    city: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    return await list_predictions(db, city=city, category=category, skip=skip, limit=limit)

@router.get("/predictions/{prediction_id}", response_model=PredictionResponse)
async def read_prediction(prediction_id: int, db: AsyncSession = Depends(get_db)):
    db_prediction = await get_prediction(db, prediction_id)
    if not db_prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return db_prediction

@router.delete("/predictions/{prediction_id}")
async def remove_prediction(prediction_id: int, db: AsyncSession = Depends(get_db)):
    success = await delete_prediction(db, prediction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"ok": True}
