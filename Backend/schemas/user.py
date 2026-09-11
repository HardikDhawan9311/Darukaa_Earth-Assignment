from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    full_name: str = Field(default="", alias="fullName")
    email: EmailStr
    role: Optional[str] = "user"

    class Config:
        populate_by_name = True

# Used for receiving registration data
class UserCreate(UserBase):
    password: str
    confirmPassword: Optional[str] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "fullName": "Jane Okonkwo",
                "email": "jane@example.com",
                "password": "strongPassword123",
                "confirmPassword": "strongPassword123",
                "role": "user"
            }
        }

# Used for returning user data (without password)
class UserOut(BaseModel):
    id: int
    full_name: str = Field(default="", alias="fullName")
    email: EmailStr
    role: Optional[str] = "user"
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# Used for receiving login data
class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True
