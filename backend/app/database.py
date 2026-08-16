from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=True,
    pool_recycle=300,
    pool_pre_ping=True
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        # For simplicity, creating all tables on startup.
        # In a real production app, use Alembic migrations instead.
        await conn.run_sync(Base.metadata.create_all)
