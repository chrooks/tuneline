from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    lastfm_username: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None

# Properties to receive on user creation
class UserCreate(UserBase):
    pass

# Properties to receive on user update
class UserUpdate(UserBase):
    lastfm_username: Optional[str] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Properties to return to client
class User(UserInDBBase):
    pass
