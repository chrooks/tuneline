from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Shared properties
class ScrobbleBase(BaseModel):
    artist: str
    album: Optional[str] = None
    track: str
    listened_at: datetime
    image_url: Optional[str] = None

# Properties to receive on scrobble creation
class ScrobbleCreate(ScrobbleBase):
    user_id: int

# Properties to receive on scrobble update
class ScrobbleUpdate(ScrobbleBase):
    pass

# Properties shared by models stored in DB
class ScrobbleInDBBase(ScrobbleBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Properties to return to client
class Scrobble(ScrobbleInDBBase):
    pass

# Properties for returning multiple scrobbles
class ScrobbleList(BaseModel):
    scrobbles: List[Scrobble]
    total: int
