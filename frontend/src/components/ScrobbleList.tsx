import React, { useRef, useEffect } from 'react';
import { Scrobble } from '../types';
import { format } from 'date-fns';

/**
 * Props for the ScrobbleList component
 */
interface ScrobbleListProps {
  /**
   * Array of scrobbles to display in the list
   */
  scrobbles: Scrobble[];
  
  /**
   * Callback function when a scrobble is hovered
   */
  onScrobbleHover: (scrobble: Scrobble | null) => void;
  
  /**
   * Callback function when a scrobble is selected (clicked)
   */
  onScrobbleSelect: (scrobble: Scrobble) => void;
  
  /**
   * Currently selected scrobble (if any)
   */
  selectedScrobble?: Scrobble | null;
  
  /**
   * Currently hovered scrobble (if any)
   */
  hoveredScrobble?: Scrobble | null;
  
  /**
   * Reference to the timeline component for scroll synchronization (optional)
   */
  timelineRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Component that displays scrobbles in a table-like list format
 * 
 * Features:
 * - Shows album art, track, artist, album, and timestamp for each scrobble
 * - Highlights selected and hovered scrobbles
 * - Synchronizes scrolling with the timeline component (when provided)
 * - Handles empty state when no scrobbles are available
 */
const ScrobbleList: React.FC<ScrobbleListProps> = ({
  scrobbles,
  onScrobbleHover,
  onScrobbleSelect,
  selectedScrobble,
  hoveredScrobble,
  timelineRef
}) => {
  // Reference to the list container for scroll synchronization
  const listRef = useRef<HTMLDivElement>(null);
  
  /**
   * Formats a date for display in the list
   * 
   * @param dateString - ISO date string to format
   * @returns Formatted date string (e.g., "Apr 3, 2025 at 10:30 PM")
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };
  
  /**
   * Since the list is now below the timeline instead of side-by-side,
   * we don't need horizontal/vertical scroll synchronization.
   * Instead, we'll just highlight the corresponding items when selected.
   */
  useEffect(() => {
    // No scroll synchronization needed with the new layout
  }, [timelineRef]);
  
  /**
   * Scrolls to a specific scrobble in the list
   * 
   * @param scrobble - The scrobble to scroll to
   */
  const scrollToScrobble = (scrobble: Scrobble) => {
    if (!listRef.current) return;
    
    // Find the index of the scrobble in the array
    const index = scrobbles.findIndex(s => s.id === scrobble.id);
    if (index === -1) return;
    
    // Get all row elements in the list
    const rows = listRef.current.querySelectorAll('tr');
    if (index >= rows.length) return;
    
    // Scroll the row into view
    rows[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  // Scroll to selected scrobble when it changes
  useEffect(() => {
    if (selectedScrobble) {
      scrollToScrobble(selectedScrobble);
    }
  }, [selectedScrobble]);

  return (
    <div className="scrobble-list-container overflow-x-auto" ref={listRef}>
      {scrobbles.length > 0 ? (
        <table className="scrobble-table">
          <thead>
            <tr>
              <th></th> {/* Album art */}
              <th>Track</th>
              <th>Artist</th>
              <th>Album</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {scrobbles.map(scrobble => (
              <tr 
                key={scrobble.id}
                className={`
                  ${selectedScrobble?.id === scrobble.id ? 'selected' : ''}
                  ${hoveredScrobble?.id === scrobble.id ? 'hovered' : ''}
                `}
                onMouseEnter={() => onScrobbleHover(scrobble)}
                onMouseLeave={() => onScrobbleHover(null)}
                onClick={() => onScrobbleSelect(scrobble)}
              >
                <td>
                  <img 
                    className="album-thumbnail" 
                    src={scrobble.image_url || '/default-album.png'} 
                    alt={`${scrobble.album || 'Album'}`} 
                  />
                </td>
                <td>{scrobble.track}</td>
                <td>{scrobble.artist}</td>
                <td>{scrobble.album || '-'}</td>
                <td>{formatDate(scrobble.listened_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-list-message">
          <p>No scrobbles found for this time period</p>
          <p>Try selecting a different time range</p>
        </div>
      )}
    </div>
  );
};

export default ScrobbleList;
