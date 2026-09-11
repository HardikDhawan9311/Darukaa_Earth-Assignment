import os
import re
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the .env file")

# Ensure postgresql+asyncpg scheme is used for async engine
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Format SSL parameters for asyncpg driver
connect_args = {}
if "sslmode=" in DATABASE_URL or "ssl=" in DATABASE_URL:
    DATABASE_URL = re.sub(r"[?&]sslmode=[^&]+", "", DATABASE_URL)
    DATABASE_URL = re.sub(r"[?&]ssl=[^&]+", "", DATABASE_URL)
    connect_args["ssl"] = "require"

engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
