from typing import List, Optional
from datetime import date
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import crud, AnalysisService, LastFMService
from app.schemas import analysis as analysis_schemas
from app.schemas import user as user_schemas

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze", response_model=analysis_schemas.AnalysisSummary)
def analyze_user_data(
    request: analysis_schemas.AnalysisRequest,
    background_tasks: BackgroundTasks,
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
        try:
            lastfm_service = LastFMService()
            
            # Fetch scrobbles with a maximum page limit to avoid timeouts
            # This is a potentially long operation, but we'll limit it to avoid excessive API calls
            raw_scrobbles = lastfm_service.fetch_all_scrobbles(
                username=request.lastfm_username,
                from_date=request.start_date,
                to_date=request.end_date,
                max_pages=300  # Limit to 300 pages (60,000 tracks) to avoid timeouts
            )
            
            # Process and store scrobbles
            processed_scrobbles = []
            for track in raw_scrobbles:
                scrobble_data = lastfm_service.extract_scrobble_data(track)
                processed_scrobbles.append(scrobble_data)
            
            if processed_scrobbles:
                crud.create_scrobbles(db, processed_scrobbles, user.id)
                
            # If there are more pages to fetch, do it in the background
            if len(raw_scrobbles) >= 60000:  # 300 pages * 200 tracks per page
                logger.info(f"Scheduling background task to fetch remaining scrobbles for {request.lastfm_username}")
                background_tasks.add_task(
                    fetch_remaining_scrobbles,
                    db=db,
                    user_id=user.id,
                    lastfm_username=request.lastfm_username,
                    start_date=request.start_date,
                    end_date=request.end_date,
                    start_page=301  # Start from page 301
                )
                
        except Exception as e:
            logger.error(f"Error fetching scrobbles from Last.fm: {e}")
            # Continue with analysis using whatever scrobbles we have
            # This way, even if Last.fm API fails, we can still provide some analysis
    
    # Get scrobbles for analysis
    scrobbles = crud.get_scrobbles_by_user(
        db, 
        user_id=user.id,
        start_date=request.start_date,
        end_date=request.end_date,
        limit=10000  # Get a large number for analysis
    )
    
    # If we have no scrobbles at all, return an error
    if not scrobbles:
        raise HTTPException(
            status_code=404, 
            detail="No scrobbles found for this user in the specified time period. Please try again later or with a different time period."
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
    # Use try/except to handle potential Last.fm API errors
    genre_distribution = []
    try:
        top_artist_names = [artist for artist, _ in top_artists[:20]]
        genre_distribution = analysis_service.get_genre_distribution(
            artists=top_artist_names,
            limit=10
        )
    except Exception as e:
        logger.error(f"Error fetching genre distribution: {e}")
        # Continue without genre distribution
    
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

def fetch_remaining_scrobbles(
    db: Session,
    user_id: int,
    lastfm_username: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    start_page: int = 1
):
    """
    Background task to fetch remaining scrobbles from Last.fm
    
    This function is designed to be run in the background to avoid timeouts
    in the main request. It will fetch scrobbles starting from the specified
    page and store them in the database.
    """
    try:
        logger.info(f"Starting background fetch of scrobbles for {lastfm_username} from page {start_page}")
        
        lastfm_service = LastFMService()
        
        # Custom implementation to fetch from a specific starting page
        # We need to get the total pages first
        first_page = lastfm_service.get_recent_tracks(
            username=lastfm_username,
            limit=200,
            page=1
        )
        
        if "recenttracks" in first_page and "@attr" in first_page["recenttracks"]:
            total_pages = int(first_page["recenttracks"]["@attr"].get("totalPages", "1"))
            
            # Fetch remaining pages
            for page in range(start_page, total_pages + 1):
                try:
                    logger.info(f"Fetching page {page} of {total_pages} for {lastfm_username}")
                    
                    response = lastfm_service.get_recent_tracks(
                        username=lastfm_username,
                        limit=200,
                        page=page
                    )
                    
                    if "recenttracks" in response and "track" in response["recenttracks"]:
                        tracks = response["recenttracks"]["track"]
                        # Last.fm returns a dict instead of a list if there's only one track
                        if not isinstance(tracks, list):
                            tracks = [tracks]
                        
                        # Filter out "now playing" tracks which don't have a date
                        tracks = [t for t in tracks if "date" in t]
                        
                        # Process and store scrobbles
                        processed_scrobbles = []
                        for track in tracks:
                            scrobble_data = lastfm_service.extract_scrobble_data(track)
                            processed_scrobbles.append(scrobble_data)
                        
                        if processed_scrobbles:
                            crud.create_scrobbles(db, processed_scrobbles, user_id)
                    
                except Exception as e:
                    logger.error(f"Error fetching page {page} for {lastfm_username}: {e}")
                    # Continue with next page
            
            logger.info(f"Completed background fetch of scrobbles for {lastfm_username}")
        
    except Exception as e:
        logger.error(f"Error in background fetch of scrobbles: {e}")

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
