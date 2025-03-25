from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import crud, LastFMService
from app.schemas import scrobble as scrobble_schemas
from app.schemas import user as user_schemas

router = APIRouter()

@router.get("/{user_id}", response_model=scrobble_schemas.ScrobbleList)
def read_scrobbles(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get scrobbles for a user"""
    # Check if user exists
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get scrobbles
    scrobbles = crud.get_scrobbles_by_user(
        db, 
        user_id=user_id, 
        skip=skip, 
        limit=limit,
        start_date=start_date,
        end_date=end_date
    )
    
    # Get total count
    total = crud.count_scrobbles_by_user(
        db, 
        user_id=user_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return {"scrobbles": scrobbles, "total": total}

@router.post("/fetch", response_model=dict)
async def fetch_scrobbles(
    background_tasks: BackgroundTasks,
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Fetch scrobbles from Last.fm for a user and store them in the database.
    This is a long-running operation, so it's executed in the background.
    """
    lastfm_username = request.get("lastfm_username")
    if not lastfm_username:
        raise HTTPException(status_code=422, detail="lastfm_username is required")
    
    start_date = None
    if request.get("start_date"):
        try:
            start_date = date.fromisoformat(request.get("start_date"))
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid start_date format")
    
    end_date = None
    if request.get("end_date"):
        try:
            end_date = date.fromisoformat(request.get("end_date"))
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid end_date format")
    # Check if user exists, create if not
    user = crud.get_user_by_lastfm_username(db, lastfm_username=lastfm_username)
    if user is None:
        user = crud.create_user(db, user_schemas.UserCreate(lastfm_username=lastfm_username))
    
    # Add background task to fetch and store scrobbles
    background_tasks.add_task(
        fetch_and_store_scrobbles,
        db=db,
        user_id=user.id,
        lastfm_username=lastfm_username,
        start_date=start_date,
        end_date=end_date
    )
    
    return {
        "message": f"Fetching scrobbles for {lastfm_username} in the background",
        "user_id": user.id
    }

def fetch_and_store_scrobbles(
    db: Session,
    user_id: int,
    lastfm_username: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Fetch scrobbles from Last.fm and store them in the database"""
    # Create Last.fm service
    lastfm_service = LastFMService()
    
    # Convert dates to datetime if provided
    from_date = datetime.combine(start_date, datetime.min.time()) if start_date else None
    to_date = datetime.combine(end_date, datetime.max.time()) if end_date else None
    
    # Fetch scrobbles from Last.fm
    scrobbles = lastfm_service.fetch_all_scrobbles(
        username=lastfm_username,
        from_date=from_date,
        to_date=to_date
    )
    
    # Process scrobbles
    processed_scrobbles = []
    for track in scrobbles:
        scrobble_data = lastfm_service.extract_scrobble_data(track)
        processed_scrobbles.append(scrobble_data)
    
    # Store scrobbles in database
    if processed_scrobbles:
        crud.create_scrobbles(db, processed_scrobbles, user_id)
