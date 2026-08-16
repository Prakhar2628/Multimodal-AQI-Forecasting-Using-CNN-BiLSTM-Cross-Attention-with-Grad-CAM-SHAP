from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.schemas.reading import PollutantReadingOut, PollutantReadingCreate
from app.crud.readings import list_readings, create_reading

router = APIRouter(tags=["Readings"])

@router.get("/readings", response_model=List[PollutantReadingOut])
async def read_readings(
    city: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(14, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    return await list_readings(db, city=city, start_date=start_date, end_date=end_date, limit=limit)

@router.post("/readings", response_model=PollutantReadingOut)
async def add_reading(reading_in: PollutantReadingCreate, db: AsyncSession = Depends(get_db)):
    return await create_reading(db, reading_in)
