from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from app.models.reading import PollutionReading
from app.schemas.reading import PollutantReadingCreate
from typing import List, Optional
from datetime import date

async def create_reading(db: AsyncSession, reading_in: PollutantReadingCreate) -> PollutionReading:
    db_reading = PollutionReading(**reading_in.model_dump())
    db.add(db_reading)
    await db.commit()
    await db.refresh(db_reading)
    return db_reading

async def list_readings(
    db: AsyncSession, city: str, start_date: Optional[date] = None, end_date: Optional[date] = None, limit: int = 14
) -> List[PollutionReading]:
    query = select(PollutionReading).filter(PollutionReading.city == city)
    
    if start_date:
        query = query.filter(PollutionReading.reading_date >= start_date)
    if end_date:
        query = query.filter(PollutionReading.reading_date <= end_date)
        
    query = query.order_by(PollutionReading.reading_date.desc()).limit(limit)
    result = await db.execute(query)
    # Return in chronological order for the model
    readings = list(result.scalars().all())
    readings.reverse()
    return readings
