from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, date

# Artist Trend schemas
class ArtistTrendBase(BaseModel):
    period: str
    artist: str
    play_count: int
    is_new_discovery: bool = False

class ArtistTrendCreate(ArtistTrendBase):
    user_id: int

class ArtistTrendInDBBase(ArtistTrendBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ArtistTrend(ArtistTrendInDBBase):
    pass

class ArtistTrendList(BaseModel):
    trends: List[ArtistTrend]
    total: int

# Listening Activity schemas
class ListeningActivityBase(BaseModel):
    date: date
    track_count: int
    listening_time: Optional[float] = None

class ListeningActivityCreate(ListeningActivityBase):
    user_id: int

class ListeningActivityInDBBase(ListeningActivityBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ListeningActivity(ListeningActivityInDBBase):
    pass

class ListeningActivityList(BaseModel):
    activities: List[ListeningActivity]
    total: int

# Analysis Request schemas
class AnalysisRequest(BaseModel):
    lastfm_username: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    limit: Optional[int] = 50

# Analysis Response schemas
class ArtistPlayCount(BaseModel):
    artist: str
    play_count: int
    is_new_discovery: bool = False

class PeriodAnalysis(BaseModel):
    period: str  # e.g., "2023-01" for January 2023
    top_artists: List[ArtistPlayCount]
    total_tracks: int
    
class GenreDistribution(BaseModel):
    genre: str
    count: int
    percentage: float

class AnalysisSummary(BaseModel):
    username: str
    period_start: date
    period_end: date
    total_scrobbles: int
    unique_artists: int
    unique_tracks: int
    new_artists_discovered: int
    most_active_date: date
    least_active_date: Optional[date] = None
    period_analysis: List[PeriodAnalysis]
    genre_distribution: Optional[List[GenreDistribution]] = None
