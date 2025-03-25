from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import crud, AnalysisService, LastFMService
from app.schemas import analysis as analysis_schemas
from app.schemas import user as user_schemas

router = APIRouter()

@router.post("/analyze", response_model=analysis_schemas.AnalysisSummary)
def analyze_user_data(
    request: analysis_schemas.AnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze a user's listening history.
    
    This endpoint will:
    1. Get or create a user with the provided Last.fm username
    2. Fetch scrobbles from Last.fm if needed
    3. Analyze the scrobbles to extract trends and statistics
    4. Store the analysis results in the database
    5. Return a summary of the analysis
    """
    # Get or create user
    user = crud.get_user_by_lastfm_username(db, lastfm_username=request.lastfm_username)
    if user is None:
        user = crud.create_user(
            db, 
            user_schemas.UserCreate(lastfm_username=request.lastfm_username)
        )
    
    # Check if we have scrobbles for this user
    scrobble_count = crud.count_scrobbles_by_user(
        db, 
        user_id=user.id,
        start_date=request.start_date,
        end_date=request.end_date
    )
    
    # If no scrobbles, fetch them from Last.fm
    if scrobble_count == 0:
        lastfm_service = LastFMService()
        
        # Fetch scrobbles
        raw_scrobbles = lastfm_service.fetch_all_scrobbles(
            username=request.lastfm_username,
            from_date=request.start_date,
            to_date=request.end_date
        )
        
        # Process and store scrobbles
        processed_scrobbles = []
        for track in raw_scrobbles:
            scrobble_data = lastfm_service.extract_scrobble_data(track)
            processed_scrobbles.append(scrobble_data)
        
        if processed_scrobbles:
            crud.create_scrobbles(db, processed_scrobbles, user.id)
    
    # Get scrobbles for analysis
    scrobbles = crud.get_scrobbles_by_user(
        db, 
        user_id=user.id,
        start_date=request.start_date,
        end_date=request.end_date,
        limit=10000  # Get a large number for analysis
    )
    
    # Analyze scrobbles
    analysis_service = AnalysisService(db)
    analysis_results = analysis_service.analyze_scrobbles(
        scrobbles=scrobbles,
        start_date=request.start_date,
        end_date=request.end_date
    )
    
    # Store analysis results
    analysis_service.store_analysis_results(user.id, analysis_results)
    
    # Get unique artists for genre analysis
    unique_artists = list(set(s.artist for s in scrobbles))
    top_artists = sorted(
        [(artist, sum(1 for s in scrobbles if s.artist == artist)) 
         for artist in unique_artists],
        key=lambda x: x[1],
        reverse=True
    )
    
    # Get genre distribution (only for top artists to avoid too many API calls)
    top_artist_names = [artist for artist, _ in top_artists[:20]]
    genre_distribution = analysis_service.get_genre_distribution(
        artists=top_artist_names,
        limit=10
    )
    
    # Create analysis summary
    summary = analysis_schemas.AnalysisSummary(
        username=request.lastfm_username,
        period_start=request.start_date or analysis_results.get("period_start", date.today()),
        period_end=request.end_date or analysis_results.get("period_end", date.today()),
        total_scrobbles=analysis_results["total_scrobbles"],
        unique_artists=analysis_results["unique_artists"],
        unique_tracks=analysis_results["unique_tracks"],
        new_artists_discovered=analysis_results["new_artists_discovered"],
        most_active_date=analysis_results["most_active_date"],
        least_active_date=analysis_results["least_active_date"],
        period_analysis=[
            analysis_schemas.PeriodAnalysis(
                period=period["period"],
                top_artists=[
                    analysis_schemas.ArtistPlayCount(
                        artist=artist["artist"],
                        play_count=artist["play_count"],
                        is_new_discovery=artist["is_new_discovery"]
                    )
                    for artist in period["top_artists"]
                ],
                total_tracks=period["total_tracks"]
            )
            for period in analysis_results["period_analysis"]
        ],
        genre_distribution=[
            analysis_schemas.GenreDistribution(
                genre=genre["genre"],
                count=genre["count"],
                percentage=genre["percentage"]
            )
            for genre in genre_distribution
        ] if genre_distribution else None
    )
    
    return summary

@router.get("/artist-trends/{user_id}", response_model=analysis_schemas.ArtistTrendList)
def get_artist_trends(
    user_id: int,
    period: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get artist trends for a user"""
    # Check if user exists
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get artist trends
    trends = crud.get_artist_trends(
        db, 
        user_id=user_id, 
        period=period,
        skip=skip, 
        limit=limit
    )
    
    # Get total count
    total = crud.count_artist_trends(
        db, 
        user_id=user_id,
        period=period
    )
    
    return {"trends": trends, "total": total}

@router.get("/listening-activity/{user_id}", response_model=analysis_schemas.ListeningActivityList)
def get_listening_activity(
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get listening activity for a user"""
    # Check if user exists
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get listening activity
    activities = crud.get_listening_activities(
        db, 
        user_id=user_id, 
        start_date=start_date,
        end_date=end_date,
        skip=skip, 
        limit=limit
    )
    
    # Get total count
    total = crud.count_listening_activities(
        db, 
        user_id=user_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return {"activities": activities, "total": total}
