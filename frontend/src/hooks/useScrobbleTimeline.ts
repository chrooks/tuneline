import { useState, useCallback, useEffect } from 'react';
import { scrobblesApi, userApi } from '../services/api';
import { Scrobble } from '../types';
import { subDays } from 'date-fns';

/**
 * Represents a time range with start and end dates
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Return type for the useScrobbleTimeline hook
 */
interface UseScrobbleTimelineReturn {
  loading: boolean;          // Indicates if scrobbles are currently being fetched
  error: string | null;      // Error message if fetch operation failed
  scrobbles: Scrobble[];     // Array of scrobbles within the selected time range
  timeRange: TimeRange;      // Currently selected time range
  setTimeRange: (range: TimeRange) => void;  // Function to update the time range
  selectedScrobble: Scrobble | null;         // Currently selected scrobble (e.g., clicked by user)
  setSelectedScrobble: (scrobble: Scrobble | null) => void;  // Function to update selected scrobble
  hoveredScrobble: Scrobble | null;          // Currently hovered scrobble
  setHoveredScrobble: (scrobble: Scrobble | null) => void;   // Function to update hovered scrobble
}

/**
 * Custom hook for managing scrobble data for the timeline view
 * 
 * This hook handles:
 * - Fetching scrobbles for a specific user within a time range
 * - Managing loading and error states
 * - Tracking selected and hovered scrobbles for UI interactions
 * - Sorting scrobbles by timestamp
 * 
 * @param username - The Last.fm username whose scrobbles to fetch
 * @param initialTimeRange - Optional initial time range (defaults to past week)
 * @returns Object containing scrobble data and state management functions
 */
export const useScrobbleTimeline = (
  username: string,
  initialTimeRange?: TimeRange
): UseScrobbleTimelineReturn => {
  // Default to past week if no time range provided
  const defaultTimeRange = {
    start: subDays(new Date(), 7),
    end: new Date()
  };

  // State for time range and scrobble data
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange || defaultTimeRange);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scrobbles, setScrobbles] = useState<Scrobble[]>([]);
  
  // State for UI interactions
  const [selectedScrobble, setSelectedScrobble] = useState<Scrobble | null>(null);
  const [hoveredScrobble, setHoveredScrobble] = useState<Scrobble | null>(null);

  /**
   * Fetches scrobbles for the specified user within the current time range
   * 
   * - Sets loading state during fetch
   * - Handles errors and updates error state
   * - Sorts scrobbles by timestamp (newest first)
   */
  const fetchScrobbles = useCallback(async () => {
    // Don't attempt to fetch if no username is provided
    if (!username) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching scrobbles for ${username} from ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}`);
      
      // First, fetch the scrobbles from Last.fm
      const fetchResponse = await scrobblesApi.fetchScrobbles(username, {
        start_date: timeRange.start.toISOString().split('T')[0],
        end_date: timeRange.end.toISOString().split('T')[0]
      });
      
      console.log('Fetch response:', fetchResponse.data);
      
      // Then get the user by Last.fm username
      const userResponse = await userApi.getUserByLastfm(username);
      
      if (!userResponse.data) {
        throw new Error(`User ${username} not found`);
      }
      
      const userId = userResponse.data.id;
      console.log(`Found user ID: ${userId}`);
      
      // Now get the scrobbles from our database
      const response = await scrobblesApi.getScrobbles(userId, {
        start_date: timeRange.start.toISOString().split('T')[0],
        end_date: timeRange.end.toISOString().split('T')[0],
        limit: 1000 // Fetch up to 1000 scrobbles (can be adjusted based on performance needs)
      });
      
      // Sort scrobbles by timestamp (newest to oldest)
      // This ensures consistent ordering for the timeline and list views
      const sortedScrobbles = [...response.data.scrobbles].sort(
        (a, b) => new Date(b.listened_at).getTime() - new Date(a.listened_at).getTime()
      );
      
      // Filter out duplicates based on id
      const uniqueScrobbles = sortedScrobbles.filter((scrobble, index, self) =>
        index === self.findIndex((s) => s.id === scrobble.id)
      );
      
      setScrobbles(uniqueScrobbles);
    } catch (err) {
      console.error('Error fetching scrobbles for timeline:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [username, timeRange]);

  // Fetch scrobbles when username or timeRange changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchScrobbles();
      } catch (err) {
        console.error('Error in useEffect fetchScrobbles:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fetchScrobbles]);

  // Return all state and functions needed by timeline components
  return {
    loading,
    error,
    scrobbles,
    timeRange,
    setTimeRange,
    selectedScrobble,
    setSelectedScrobble,
    hoveredScrobble,
    setHoveredScrobble
  };
};
