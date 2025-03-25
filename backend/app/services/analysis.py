from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict, Counter
import calendar
import logging
from app.services.lastfm import LastFMService
from app.models.scrobble import Scrobble
from app.models.analysis import ArtistTrend, ListeningActivity
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AnalysisService:
    """Service for analyzing Last.fm scrobble data"""
    
    def __init__(self, db: Session, lastfm_service: Optional[LastFMService] = None):
        self.db = db
        self.lastfm_service = lastfm_service or LastFMService()
    
    def format_period(self, dt: datetime) -> str:
        """Format a datetime into a period string (YYYY-MM)"""
        return dt.strftime("%Y-%m")
    
    def get_period_range(self, start_date: date, end_date: date) -> List[str]:
        """Get a list of all periods (months) between start_date and end_date"""
        periods = []
        current_date = date(start_date.year, start_date.month, 1)
        
        while current_date <= end_date:
            periods.append(current_date.strftime("%Y-%m"))
            # Move to the next month
            if current_date.month == 12:
                current_date = date(current_date.year + 1, 1, 1)
            else:
                current_date = date(current_date.year, current_date.month + 1, 1)
        
        return periods
    
    def analyze_scrobbles(
        self, 
        scrobbles: List[Scrobble],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Analyze a list of scrobbles to extract trends and statistics
        
        Args:
            scrobbles: List of Scrobble objects
            start_date: Start date for analysis (inclusive)
            end_date: End date for analysis (inclusive)
            
        Returns:
            Dictionary containing analysis results
        """
        if not scrobbles:
            return {
                "total_scrobbles": 0,
                "unique_artists": 0,
                "unique_tracks": 0,
                "period_analysis": [],
                "artist_trends": [],
                "listening_activity": []
            }
        
        # Sort scrobbles by listened_at
        sorted_scrobbles = sorted(scrobbles, key=lambda s: s.listened_at)
        
        # Set default dates if not provided
        if not start_date:
            start_date = sorted_scrobbles[0].listened_at.date()
        if not end_date:
            end_date = sorted_scrobbles[-1].listened_at.date()
        
        # Filter scrobbles by date range
        filtered_scrobbles = [
            s for s in sorted_scrobbles 
            if start_date <= s.listened_at.date() <= end_date
        ]
        
        if not filtered_scrobbles:
            return {
                "total_scrobbles": 0,
                "unique_artists": 0,
                "unique_tracks": 0,
                "period_analysis": [],
                "artist_trends": [],
                "listening_activity": []
            }
        
        # Get basic stats
        total_scrobbles = len(filtered_scrobbles)
        unique_artists = len(set(s.artist for s in filtered_scrobbles))
        unique_tracks = len(set((s.artist, s.track) for s in filtered_scrobbles))
        
        # Group scrobbles by period (month)
        scrobbles_by_period = defaultdict(list)
        for scrobble in filtered_scrobbles:
            period = self.format_period(scrobble.listened_at)
            scrobbles_by_period[period].append(scrobble)
        
        # Analyze each period
        period_analysis = []
        all_periods = self.get_period_range(start_date, end_date)
        
        # Track first appearance of each artist
        artist_first_seen = {}
        artist_trends = []
        
        for period in all_periods:
            period_scrobbles = scrobbles_by_period.get(period, [])
            
            # Count plays per artist
            artist_play_count = Counter(s.artist for s in period_scrobbles)
            top_artists = [
                {
                    "artist": artist,
                    "play_count": count,
                    "is_new_discovery": artist not in artist_first_seen
                }
                for artist, count in artist_play_count.most_common(10)
            ]
            
            # Update first seen tracking
            for artist in artist_play_count:
                if artist not in artist_first_seen:
                    artist_first_seen[artist] = period
            
            # Create period analysis
            period_analysis.append({
                "period": period,
                "top_artists": top_artists,
                "total_tracks": len(period_scrobbles)
            })
            
            # Create artist trends for storage
            for artist, count in artist_play_count.items():
                artist_trends.append({
                    "period": period,
                    "artist": artist,
                    "play_count": count,
                    "is_new_discovery": artist_first_seen[artist] == period
                })
        
        # Analyze listening activity by day
        listening_by_day = defaultdict(int)
        for scrobble in filtered_scrobbles:
            day = scrobble.listened_at.date()
            listening_by_day[day] += 1
        
        listening_activity = [
            {"date": day, "track_count": count}
            for day, count in sorted(listening_by_day.items())
        ]
        
        # Find most and least active days
        if listening_activity:
            most_active_date = max(listening_by_day.items(), key=lambda x: x[1])[0]
            
            # For least active, we need to fill in missing days first
            all_days = []
            current_day = start_date
            while current_day <= end_date:
                all_days.append(current_day)
                current_day += timedelta(days=1)
            
            # Find least active among days with at least one scrobble
            active_days = listening_by_day.keys()
            inactive_days = [day for day in all_days if day not in active_days]
            
            if inactive_days:
                least_active_date = None  # No scrobbles on some days
            else:
                least_active_date = min(listening_by_day.items(), key=lambda x: x[1])[0]
        else:
            most_active_date = None
            least_active_date = None
        
        # Count new artists discovered
        new_artists_discovered = sum(1 for artist, period in artist_first_seen.items() 
                                    if period in all_periods)
        
        return {
            "total_scrobbles": total_scrobbles,
            "unique_artists": unique_artists,
            "unique_tracks": unique_tracks,
            "new_artists_discovered": new_artists_discovered,
            "most_active_date": most_active_date,
            "least_active_date": least_active_date,
            "period_analysis": period_analysis,
            "artist_trends": artist_trends,
            "listening_activity": listening_activity
        }
    
    def store_analysis_results(
        self, 
        user_id: int, 
        analysis_results: Dict[str, Any]
    ) -> None:
        """Store analysis results in the database"""
        # Store artist trends
        for trend_data in analysis_results["artist_trends"]:
            trend = ArtistTrend(
                user_id=user_id,
                period=trend_data["period"],
                artist=trend_data["artist"],
                play_count=trend_data["play_count"],
                is_new_discovery=trend_data["is_new_discovery"]
            )
            self.db.add(trend)
        
        # Store listening activity
        for activity_data in analysis_results["listening_activity"]:
            activity = ListeningActivity(
                user_id=user_id,
                date=activity_data["date"],
                track_count=activity_data["track_count"]
            )
            self.db.add(activity)
        
        self.db.commit()
    
    def get_genre_distribution(
        self, 
        artists: List[str], 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get genre distribution for a list of artists
        
        This is a simplified implementation that doesn't account for play counts,
        just the number of artists in each genre.
        """
        genre_counter = Counter()
        
        for artist in artists:
            genres = self.lastfm_service.get_genres_for_artist(artist)
            genre_counter.update(genres)
        
        total_genres = sum(genre_counter.values())
        
        if total_genres == 0:
            return []
        
        # Get top genres
        top_genres = genre_counter.most_common(limit)
        
        return [
            {
                "genre": genre,
                "count": count,
                "percentage": (count / total_genres) * 100
            }
            for genre, count in top_genres
        ]
