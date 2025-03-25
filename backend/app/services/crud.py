from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.scrobble import Scrobble
from app.models.analysis import ArtistTrend, ListeningActivity
from app.schemas import user as user_schemas
from app.schemas import scrobble as scrobble_schemas
from app.schemas import analysis as analysis_schemas

# User CRUD operations
def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_lastfm_username(db: Session, lastfm_username: str) -> Optional[User]:
    return db.query(User).filter(User.lastfm_username == lastfm_username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: user_schemas.UserCreate) -> User:
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: user_schemas.UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True

# Scrobble CRUD operations
def get_scrobble(db: Session, scrobble_id: int) -> Optional[Scrobble]:
    return db.query(Scrobble).filter(Scrobble.id == scrobble_id).first()

def get_scrobbles_by_user(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[Scrobble]:
    query = db.query(Scrobble).filter(Scrobble.user_id == user_id)
    
    if start_date:
        query = query.filter(Scrobble.listened_at >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(Scrobble.listened_at <= datetime.combine(end_date, datetime.max.time()))
    
    return query.order_by(Scrobble.listened_at.desc()).offset(skip).limit(limit).all()

def count_scrobbles_by_user(
    db: Session, 
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> int:
    query = db.query(Scrobble).filter(Scrobble.user_id == user_id)
    
    if start_date:
        query = query.filter(Scrobble.listened_at >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(Scrobble.listened_at <= datetime.combine(end_date, datetime.max.time()))
    
    return query.count()

def create_scrobble(db: Session, scrobble: scrobble_schemas.ScrobbleCreate) -> Scrobble:
    db_scrobble = Scrobble(**scrobble.dict())
    db.add(db_scrobble)
    db.commit()
    db.refresh(db_scrobble)
    return db_scrobble

def create_scrobbles(db: Session, scrobbles: List[Dict[str, Any]], user_id: int) -> List[Scrobble]:
    """Create multiple scrobbles at once"""
    db_scrobbles = []
    
    for scrobble_data in scrobbles:
        # Add user_id to each scrobble
        scrobble_data["user_id"] = user_id
        
        # Create Scrobble object
        db_scrobble = Scrobble(**scrobble_data)
        db.add(db_scrobble)
        db_scrobbles.append(db_scrobble)
    
    db.commit()
    
    # Refresh all scrobbles to get their IDs
    for scrobble in db_scrobbles:
        db.refresh(scrobble)
    
    return db_scrobbles

def delete_scrobble(db: Session, scrobble_id: int) -> bool:
    db_scrobble = get_scrobble(db, scrobble_id)
    if not db_scrobble:
        return False
    
    db.delete(db_scrobble)
    db.commit()
    return True

# Artist Trend CRUD operations
def get_artist_trends(
    db: Session, 
    user_id: int, 
    period: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ArtistTrend]:
    query = db.query(ArtistTrend).filter(ArtistTrend.user_id == user_id)
    
    if period:
        query = query.filter(ArtistTrend.period == period)
    
    return query.order_by(ArtistTrend.period, ArtistTrend.play_count.desc()).offset(skip).limit(limit).all()

def count_artist_trends(
    db: Session, 
    user_id: int,
    period: Optional[str] = None
) -> int:
    query = db.query(ArtistTrend).filter(ArtistTrend.user_id == user_id)
    
    if period:
        query = query.filter(ArtistTrend.period == period)
    
    return query.count()

# Listening Activity CRUD operations
def get_listening_activities(
    db: Session, 
    user_id: int, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ListeningActivity]:
    query = db.query(ListeningActivity).filter(ListeningActivity.user_id == user_id)
    
    if start_date:
        query = query.filter(ListeningActivity.date >= start_date)
    
    if end_date:
        query = query.filter(ListeningActivity.date <= end_date)
    
    return query.order_by(ListeningActivity.date).offset(skip).limit(limit).all()

def count_listening_activities(
    db: Session, 
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> int:
    query = db.query(ListeningActivity).filter(ListeningActivity.user_id == user_id)
    
    if start_date:
        query = query.filter(ListeningActivity.date >= start_date)
    
    if end_date:
        query = query.filter(ListeningActivity.date <= end_date)
    
    return query.count()
