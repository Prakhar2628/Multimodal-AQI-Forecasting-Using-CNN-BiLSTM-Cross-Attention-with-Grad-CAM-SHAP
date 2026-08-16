from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionCreate
from typing import List, Optional

async def create_prediction(db: AsyncSession, prediction_in: PredictionCreate) -> Prediction:
    from pydantic import BaseModel
    
    readings_serialized = None
    if prediction_in.readings:
        readings_serialized = []
        for r in prediction_in.readings:
            d = {}
            if isinstance(r, BaseModel):
                d = r.model_dump()
            elif isinstance(r, dict):
                d = dict(r)
            else:
                d = getattr(r, "__dict__", {})
            
            # Convert date/datetime objects to string ISO format
            if "date" in d and d["date"] is not None:
                if hasattr(d["date"], "isoformat"):
                    d["date"] = d["date"].isoformat()
                else:
                    d["date"] = str(d["date"])
            readings_serialized.append(d)

    db_prediction = Prediction(
        city=prediction_in.city,
        image_path=prediction_in.image_path,
        predicted_category=prediction_in.predicted_category,
        confidence=prediction_in.confidence,
        all_probabilities=prediction_in.all_probabilities,
        health_advisory=prediction_in.health_advisory.model_dump(),
        weather=prediction_in.weather.model_dump() if prediction_in.weather else None,
        readings=readings_serialized
    )
    db.add(db_prediction)
    await db.commit()
    await db.refresh(db_prediction)
    return db_prediction

async def get_prediction(db: AsyncSession, prediction_id: int) -> Optional[Prediction]:
    result = await db.execute(select(Prediction).filter(Prediction.id == prediction_id))
    return result.scalar_one_or_none()

async def list_predictions(
    db: AsyncSession, city: Optional[str] = None, category: Optional[str] = None, skip: int = 0, limit: int = 50
) -> List[Prediction]:
    query = select(Prediction)
    if city:
        query = query.filter(Prediction.city == city)
    if category:
        query = query.filter(Prediction.predicted_category == category)
    
    query = query.order_by(Prediction.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

async def delete_prediction(db: AsyncSession, prediction_id: int) -> bool:
    db_prediction = await get_prediction(db, prediction_id)
    if db_prediction:
        await db.delete(db_prediction)
        await db.commit()
        return True
    return False
