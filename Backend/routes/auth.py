from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config.database import get_db
from config.security import get_password_hash, verify_password
import models, schemas

router = APIRouter(
    # prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user in Darukaa Earth.
    """
    try:
        # Check if email is already registered
        existing_user_query = await db.execute(select(models.User).filter(models.User.email == user.email))
        existing_user = existing_user_query.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="A user with this email address is already registered."
            )

        # Hash the password for security
        hashed_pw = get_password_hash(user.password)

        new_user = models.User(
            full_name=user.full_name,
            email=user.email,
            password=hashed_pw, # Store hashed password
            role=user.role
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return new_user
    except HTTPException as http_ex:
        # Pass through our specific HTTP exceptions
        raise http_ex
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while creating your account.")

@router.post("/login", response_model=schemas.UserOut)
async def login_user(user_credentials: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login a user and verify password.
    """
    # 1. Find the user by email
    user_query = await db.execute(select(models.User).filter(models.User.email == user_credentials.email))
    user = user_query.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )

    # 2. Verify the hashed password
    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )

    return user
