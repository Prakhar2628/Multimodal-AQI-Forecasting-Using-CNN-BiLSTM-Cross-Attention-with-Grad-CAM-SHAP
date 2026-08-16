import json
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.health_risk import HealthRiskReference
from app.config import settings

async def get_health_advisory(db: AsyncSession, category: str) -> dict | None:
    result = await db.execute(select(HealthRiskReference).filter(HealthRiskReference.category == category))
    db_advisory = result.scalar_one_or_none()
    
    if db_advisory:
        return {
            "risk": db_advisory.risk,
            "asthma_risk": db_advisory.asthma_risk,
            "outdoor_exercise": db_advisory.outdoor_exercise,
            "mask": db_advisory.mask,
            "children": db_advisory.children
        }
    return None

async def seed_health_risk_reference(db: AsyncSession):
    # Check if we already have data
    result = await db.execute(select(HealthRiskReference).limit(1))
    if result.scalar_one_or_none():
        return

    # Seed from class_mapping.json
    mapping_file = Path(settings.MODEL_ARTIFACTS_DIR) / "class_mapping.json"
    if not mapping_file.exists():
        print(f"Warning: {mapping_file} not found. Cannot seed health risks.")
        return

    with open(mapping_file, "r") as f:
        mapping_data = json.load(f)
        
    health_risks = mapping_data.get("health_risk_map", {})
    for category, details in health_risks.items():
        db_risk = HealthRiskReference(
            category=category,
            risk=details.get("risk", ""),
            asthma_risk=details.get("asthma_risk", ""),
            outdoor_exercise=details.get("outdoor_exercise", ""),
            mask=details.get("mask", ""),
            children=details.get("children", "")
        )
        db.add(db_risk)
    
    await db.commit()
    print("Health risk references seeded successfully.")
