import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the .env file")

import re

# Auto-fix scheme for asyncpg driver if postgres:// or postgresql:// is provided
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# asyncpg expects connect_args={"ssl": "require"} rather than ?sslmode=require in the URL
connect_args = {}
if "sslmode=" in DATABASE_URL or "ssl=" in DATABASE_URL:
    DATABASE_URL = re.sub(r"[?&]sslmode=[^&]+", "", DATABASE_URL)
    DATABASE_URL = re.sub(r"[?&]ssl=[^&]+", "", DATABASE_URL)
    connect_args["ssl"] = "require"

# Create the async engine
engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=True, # Set to False in production
)

# Create a session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Dependency injection for FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
