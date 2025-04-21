import requests
import time
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Tuple
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class LastFMService:
    """Service for interacting with the Last.fm API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.LASTFM_API_KEY
        self.base_url = settings.LASTFM_API_URL
        
        if not self.api_key:
            raise ValueError("Last.fm API key is required")
    
    def _make_request(self, method: str, params: Dict[str, Any], timeout: int = 10, max_retries: int = 3) -> Dict[str, Any]:
        """
        Make a request to the Last.fm API with retry logic and timeout
        
        Args:
            method: Last.fm API method to call
            params: Parameters for the API call
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            
        Returns:
            JSON response from the API
            
        Raises:
            requests.RequestException: If the request fails after all retries
        """
        params.update({
            "method": method,
            "api_key": self.api_key,
            "format": "json"
        })
        
        retry_count = 0
        last_error = None
        
        while retry_count < max_retries:
            try:
                response = requests.get(self.base_url, params=params, timeout=timeout)
                response.raise_for_status()
                return response.json()
            except requests.RequestException as e:
                retry_count += 1
                last_error = e
                logger.warning(f"Last.fm API request failed (attempt {retry_count}/{max_retries}): {e}")
                
                if retry_count < max_retries:
                    # Exponential backoff
                    wait_time = 2 ** retry_count
                    logger.info(f"Waiting {wait_time} seconds before retrying...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Last.fm API request failed after {max_retries} attempts: {e}")
                    raise
    
    def get_user_info(self, username: str) -> Dict[str, Any]:
        """Get information about a Last.fm user"""
        params = {"user": username}
        return self._make_request("user.getInfo", params)
    
    def get_recent_tracks(
        self, 
        username: str, 
        limit: int = 200, 
        page: int = 1,
        from_timestamp: Optional[int] = None,
        to_timestamp: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get a user's recent tracks"""
        params = {
            "user": username,
            "limit": limit,
            "page": page
        }
        
        if from_timestamp:
            params["from"] = from_timestamp
        
        if to_timestamp:
            params["to"] = to_timestamp
        
        return self._make_request("user.getRecentTracks", params)
    
    def get_top_artists(
        self,
        username: str,
        period: str = "overall",  # overall | 7day | 1month | 3month | 6month | 12month
        limit: int = 50,
        page: int = 1
    ) -> Dict[str, Any]:
        """Get a user's top artists"""
        params = {
            "user": username,
            "period": period,
            "limit": limit,
            "page": page
        }
        
        return self._make_request("user.getTopArtists", params)
    
    def get_artist_info(self, artist: str) -> Dict[str, Any]:
        """Get information about an artist, including tags (genres)"""
        params = {"artist": artist}
        return self._make_request("artist.getInfo", params)
    
    def fetch_all_scrobbles(
        self, 
        username: str, 
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        max_retries: int = 3,
        max_pages: int = 500  # Limit the number of pages to fetch to avoid excessive API calls
    ) -> List[Dict[str, Any]]:
        """
        Fetch all scrobbles for a user within a date range.
        This handles pagination automatically and includes error handling.
        
        Args:
            username: Last.fm username
            from_date: Start date for fetching scrobbles
            to_date: End date for fetching scrobbles
            max_retries: Maximum number of retry attempts for failed requests
            max_pages: Maximum number of pages to fetch (to avoid excessive API calls)
            
        Returns:
            List of scrobble data from Last.fm API
        """
        # Convert date to datetime if needed
        if from_date and isinstance(from_date, date) and not isinstance(from_date, datetime):
            from_date = datetime.combine(from_date, datetime.min.time())
        
        if to_date and isinstance(to_date, date) and not isinstance(to_date, datetime):
            to_date = datetime.combine(to_date, datetime.max.time())
            
        from_timestamp = int(from_date.timestamp()) if from_date else None
        to_timestamp = int(to_date.timestamp()) if to_date else None
        
        all_tracks = []
        page = 1
        total_pages = 1  # Will be updated after first request
        failed_pages = []
        
        while page <= total_pages and page <= max_pages:
            retry_count = 0
            success = False
            
            # Retry logic for transient errors
            while retry_count < max_retries and not success:
                try:
                    logger.info(f"Fetching page {page} of {total_pages} for user {username}")
                    response = self.get_recent_tracks(
                        username=username,
                        limit=200,  # Max allowed by Last.fm
                        page=page,
                        from_timestamp=from_timestamp,
                        to_timestamp=to_timestamp
                    )
                    
                    # Update total pages on first request
                    if page == 1 and "recenttracks" in response and "@attr" in response["recenttracks"]:
                        total_pages = int(response["recenttracks"]["@attr"].get("totalPages", "1"))
                        # Cap total_pages to max_pages
                        total_pages = min(total_pages, max_pages)
                        logger.info(f"Total pages: {total_pages} (capped to {max_pages})")
                    
                    # Extract tracks
                    if "recenttracks" in response and "track" in response["recenttracks"]:
                        tracks = response["recenttracks"]["track"]
                        # Last.fm returns a dict instead of a list if there's only one track
                        if not isinstance(tracks, list):
                            tracks = [tracks]
                        
                        # Filter out "now playing" tracks which don't have a date
                        tracks = [t for t in tracks if "date" in t]
                        all_tracks.extend(tracks)
                    
                    success = True
                    
                except requests.RequestException as e:
                    retry_count += 1
                    logger.warning(f"Error fetching page {page} for user {username} (attempt {retry_count}/{max_retries}): {e}")
                    
                    if retry_count >= max_retries:
                        # Log the failure but continue with other pages
                        logger.error(f"Failed to fetch page {page} for user {username} after {max_retries} attempts: {e}")
                        failed_pages.append(page)
                    else:
                        # Exponential backoff before retrying
                        wait_time = 2 ** retry_count
                        logger.info(f"Waiting {wait_time} seconds before retrying...")
                        time.sleep(wait_time)
            
            page += 1
        
        if failed_pages:
            logger.warning(f"Completed with {len(failed_pages)} failed pages: {failed_pages}")
        
        logger.info(f"Successfully fetched {len(all_tracks)} tracks for user {username}")
        return all_tracks
    
    def extract_scrobble_data(self, track: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant data from a track object returned by Last.fm API"""
        listened_at = datetime.fromtimestamp(int(track["date"]["uts"]))
        
        # Extract image URL (use the largest available)
        image_url = None
        if "image" in track and isinstance(track["image"], list):
            for img in track["image"]:
                if img.get("size") == "extralarge" and "#text" in img and img["#text"]:
                    image_url = img["#text"]
                    break
        
        return {
            "artist": track.get("artist", {}).get("#text", "Unknown Artist"),
            "album": track.get("album", {}).get("#text"),
            "track": track.get("name", "Unknown Track"),
            "listened_at": listened_at,
            "image_url": image_url
        }
    
    def get_genres_for_artist(self, artist: str) -> List[str]:
        """Get genres (tags) for an artist"""
        try:
            response = self.get_artist_info(artist)
            if "artist" in response and "tags" in response["artist"] and "tag" in response["artist"]["tags"]:
                tags = response["artist"]["tags"]["tag"]
                if not isinstance(tags, list):
                    tags = [tags]
                return [tag["name"] for tag in tags if "name" in tag]
            return []
        except Exception as e:
            logger.error(f"Failed to get genres for artist {artist}: {e}")
            return []
