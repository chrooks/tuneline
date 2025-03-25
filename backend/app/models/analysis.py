from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class ArtistTrend(Base):
    __tablename__ = "artist_trends"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Time period for this trend (e.g., "2023-01" for January 2023)
    period = Column(String, index=True)
    
    # Artist data
    artist = Column(String, index=True)
    play_count = Column(Integer)
    
    # Is this a newly discovered artist in this period?
    is_new_discovery = Column(Boolean, default=False)
    
    # When this analysis was performed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="artist_trends")

# Add relationship to User model
from app.models.user import User
User.artist_trends = relationship("ArtistTrend", back_populates="user")


class ListeningActivity(Base):
    __tablename__ = "listening_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Date for this activity record
    date = Column(DateTime(timezone=True), index=True)
    
    # Number of tracks listened to on this date
    track_count = Column(Integer)
    
    # Total listening time in minutes (if available)
    listening_time = Column(Float, nullable=True)
    
    # When this analysis was performed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="listening_activities")

# Add relationship to User model
User.listening_activities = relationship("ListeningActivity", back_populates="user")
