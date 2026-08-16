from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas.city import CityCreate, CityUpdate, CityOut
from app.crud.cities import create_city, get_city, get_city_by_name, list_cities, update_city, delete_city

router = APIRouter(tags=["Cities"])

@router.post("/cities", response_model=CityOut)
async def create_new_city(city_in: CityCreate, db: AsyncSession = Depends(get_db)):
    db_city = await get_city_by_name(db, city_in.name)
    if db_city:
        raise HTTPException(status_code=400, detail="City already registered")
    return await create_city(db, city_in)

@router.get("/cities", response_model=List[CityOut])
async def read_cities(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await list_cities(db, skip=skip, limit=limit)

@router.get("/cities/{city_id}", response_model=CityOut)
async def read_city(city_id: int, db: AsyncSession = Depends(get_db)):
    db_city = await get_city(db, city_id)
    if not db_city:
        raise HTTPException(status_code=404, detail="City not found")
    return db_city

@router.put("/cities/{city_id}", response_model=CityOut)
async def update_existing_city(city_id: int, city_in: CityUpdate, db: AsyncSession = Depends(get_db)):
    db_city = await get_city(db, city_id)
    if not db_city:
        raise HTTPException(status_code=404, detail="City not found")
    return await update_city(db, db_city, city_in)

@router.delete("/cities/{city_id}")
async def remove_city(city_id: int, db: AsyncSession = Depends(get_db)):
    success = await delete_city(db, city_id)
    if not success:
        raise HTTPException(status_code=404, detail="City not found")
    return {"ok": True}
