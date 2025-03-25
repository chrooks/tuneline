// User types
export interface User {
  id: number;
  lastfm_username: string;
  email?: string;
  name?: string;
  created_at: string;
  updated_at?: string;
}

// Scrobble types
export interface Scrobble {
  id: number;
  user_id: number;
  artist: string;
  album?: string;
  track: string;
  listened_at: string;
  image_url?: string;
  created_at: string;
}

export interface ScrobbleList {
  scrobbles: Scrobble[];
  total: number;
}

// Analysis types
export interface ArtistPlayCount {
  artist: string;
  play_count: number;
  is_new_discovery: boolean;
}

export interface PeriodAnalysis {
  period: string;
  top_artists: ArtistPlayCount[];
  total_tracks: number;
}

export interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
}

export interface AnalysisSummary {
  username: string;
  period_start: string;
  period_end: string;
  total_scrobbles: number;
  unique_artists: number;
  unique_tracks: number;
  new_artists_discovered: number;
  most_active_date: string;
  least_active_date?: string;
  period_analysis: PeriodAnalysis[];
  genre_distribution?: GenreDistribution[];
}

export interface ArtistTrend {
  id: number;
  user_id: number;
  period: string;
  artist: string;
  play_count: number;
  is_new_discovery: boolean;
  created_at: string;
}

export interface ArtistTrendList {
  trends: ArtistTrend[];
  total: number;
}

export interface ListeningActivity {
  id: number;
  user_id: number;
  date: string;
  track_count: number;
  listening_time?: number;
  created_at: string;
}

export interface ListeningActivityList {
  activities: ListeningActivity[];
  total: number;
}

// Form types
export interface AnalysisRequest {
  lastfm_username: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}
