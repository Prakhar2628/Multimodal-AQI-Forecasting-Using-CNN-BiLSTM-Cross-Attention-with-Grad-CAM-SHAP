from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.city import City
from app.schemas.city import CityCreate, CityUpdate
from typing import List, Optional

async def create_city(db: AsyncSession, city_in: CityCreate) -> City:
    db_city = City(**city_in.model_dump())
    db.add(db_city)
    await db.commit()
    await db.refresh(db_city)
    return db_city

async def get_city(db: AsyncSession, city_id: int) -> Optional[City]:
    result = await db.execute(select(City).filter(City.id == city_id))
    return result.scalar_one_or_none()

async def get_city_by_name(db: AsyncSession, name: str) -> Optional[City]:
    result = await db.execute(select(City).filter(City.name == name))
    return result.scalar_one_or_none()

async def list_cities(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[City]:
    result = await db.execute(select(City).offset(skip).limit(limit))
    return list(result.scalars().all())

async def update_city(db: AsyncSession, db_city: City, city_in: CityUpdate) -> City:
    update_data = city_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_city, field, value)
    db.add(db_city)
    await db.commit()
    await db.refresh(db_city)
    return db_city

async def delete_city(db: AsyncSession, city_id: int) -> bool:
    db_city = await get_city(db, city_id)
    if db_city:
        await db.delete(db_city)
        await db.commit()
        return True
    return False
