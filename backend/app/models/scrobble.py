from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Scrobble(Base):
    __tablename__ = "scrobbles"
    
    # Add a unique constraint to prevent duplicate scrobbles
    __table_args__ = (
        UniqueConstraint('user_id', 'artist', 'track', 'listened_at', name='uix_scrobble_user_track_time'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Core scrobble data
    artist = Column(String, index=True)
    album = Column(String, nullable=True)
    track = Column(String)
    listened_at = Column(DateTime(timezone=True), index=True)
    
    # Optional metadata that might be useful for analysis
    # These can be populated from Last.fm API responses
    image_url = Column(String, nullable=True)  # Album/track artwork
    
    # Timestamp for when the record was created in our database
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="scrobbles")

# Add relationship to User model
from app.models.user import User
User.scrobbles = relationship("Scrobble", back_populates="user")
