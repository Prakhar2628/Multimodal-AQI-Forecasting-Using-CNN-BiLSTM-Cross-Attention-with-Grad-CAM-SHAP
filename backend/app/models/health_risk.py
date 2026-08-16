from sqlalchemy import Column, String
from app.database import Base

class HealthRiskReference(Base):
    __tablename__ = "health_risk_reference"

    category = Column(String, primary_key=True, index=True)
    risk = Column(String, nullable=False)
    asthma_risk = Column(String, nullable=False)
    outdoor_exercise = Column(String, nullable=False)
    mask = Column(String, nullable=False)
    children = Column(String, nullable=False)
