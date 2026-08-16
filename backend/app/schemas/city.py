from pydantic import BaseModel
from typing import Optional

class CityBase(BaseModel):
    name: str
    state: Optional[str] = None
    country: str = "India"
    lat: Optional[float] = None
    lon: Optional[float] = None

class CityCreate(CityBase):
    pass

class CityUpdate(CityBase):
    pass

class CityOut(CityBase):
    id: int

    class Config:
        from_attributes = True
