from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import crud
from app.schemas import user as user_schemas

router = APIRouter()

@router.post("/", response_model=user_schemas.User)
def create_user(user: user_schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = crud.get_user_by_lastfm_username(db, lastfm_username=user.lastfm_username)
    if db_user:
        raise HTTPException(status_code=400, detail="Last.fm username already registered")
    return crud.create_user(db=db, user=user)

@router.get("/", response_model=List[user_schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all users"""
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=user_schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/by-lastfm/{lastfm_username}", response_model=user_schemas.User)
def read_user_by_lastfm(lastfm_username: str, db: Session = Depends(get_db)):
    """Get a user by Last.fm username"""
    db_user = crud.get_user_by_lastfm_username(db, lastfm_username=lastfm_username)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=user_schemas.User)
def update_user(
    user_id: int, 
    user: user_schemas.UserUpdate, 
    db: Session = Depends(get_db)
):
    """Update a user"""
    db_user = crud.update_user(db, user_id=user_id, user=user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}", response_model=bool)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user"""
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return success
