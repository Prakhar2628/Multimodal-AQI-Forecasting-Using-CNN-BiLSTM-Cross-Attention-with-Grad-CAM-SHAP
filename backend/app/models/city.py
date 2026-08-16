from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    state = Column(String, nullable=True)
    country = Column(String, default="India")
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
