import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { Scrobble } from '../types';
import { TimeRange } from '../hooks/useScrobbleTimeline';
import { format, differenceInMilliseconds, differenceInDays } from 'date-fns';

/**
 * Props for the ScrobbleTimeline component
 */
interface ScrobbleTimelineProps {
  /**
   * Array of scrobbles to display on the timeline
   */
  scrobbles: Scrobble[];
  
  /**
   * The selected time range for the timeline
   */
  timeRange: TimeRange;
  
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
}

/**
 * Interface for a positioned scrobble on the timeline
 */
interface PositionedScrobble extends Scrobble {
  /**
   * X-coordinate position on the timeline (in pixels)
   */
  position: number;
}

/**
 * Interface for a time marker on the timeline
 */
interface TimeMarker {
  /**
   * X-coordinate position on the timeline (in pixels)
   */
  position: number;
  
  /**
   * Label text to display for the marker
   */
  label: string;
  
  /**
   * Full date object for the marker
   */
  date: Date;
}

/**
 * Component that displays scrobbles on a horizontal timeline
 * 
 * Features:
 * - Shows album artwork as plot points positioned by timestamp
 * - Displays time markers at appropriate intervals
 * - Adapts to different time ranges
 * - Supports hover and selection interactions
 * - Shows tooltips with scrobble details on hover
 */
const ScrobbleTimeline = forwardRef<HTMLDivElement, ScrobbleTimelineProps>(
  function ScrobbleTimeline(props, ref) {
    const {
      scrobbles,
      timeRange,
      onScrobbleHover,
      onScrobbleSelect,
      selectedScrobble,
      hoveredScrobble
    } = props;
    
    // Create a local ref that we'll use internally
    const localTimelineRef = useRef<HTMLDivElement>(null);
    
    // State for timeline dimensions and calculated positions
    const [timelineWidth, setTimelineWidth] = useState<number>(0);
    const [positionedScrobbles, setPositionedScrobbles] = useState<PositionedScrobble[]>([]);
    const [timeMarkers, setTimeMarkers] = useState<TimeMarker[]>([]);
    
    // Minimum width per scrobble (album art + padding)
    const MIN_SCROBBLE_WIDTH = 60;
    
    // Minimum width for the timeline (viewport width or calculated width)
    const MIN_TIMELINE_WIDTH = 800;
    
    /**
     * Calculates the appropriate timeline width based on:
     * - Number of scrobbles
     * - Time range duration
     * - Minimum width requirements
     * 
     * This ensures all scrobbles are comfortably visible and properly spaced.
     */
    const calculateTimelineWidth = (): number => {
      // Calculate minimum width needed for all scrobbles
      const minWidthForScrobbles = scrobbles.length * MIN_SCROBBLE_WIDTH;
      
      // Calculate width based on time range (1 day = 200px minimum)
      const daysInRange = differenceInDays(timeRange.end, timeRange.start) + 1;
      const widthBasedOnDays = daysInRange * 200;
      
      // Use the larger of the two calculations, but not less than MIN_TIMELINE_WIDTH
      return Math.max(minWidthForScrobbles, widthBasedOnDays, MIN_TIMELINE_WIDTH);
    };
    
    /**
     * Positions scrobbles on the timeline based on their timestamps
     * 
     * @param width - The calculated width of the timeline
     * @returns Array of scrobbles with position information
     */
    const positionScrobbles = (width: number): PositionedScrobble[] => {
      if (scrobbles.length === 0) return [];
      
      const timeRangeMs = differenceInMilliseconds(timeRange.end, timeRange.start);
      
      return scrobbles.map(scrobble => {
        const scrobbleDate = new Date(scrobble.listened_at);
        
        // Calculate position as percentage of time range
        const msFromStart = differenceInMilliseconds(scrobbleDate, timeRange.start);
        const positionPercentage = Math.max(0, Math.min(1, msFromStart / timeRangeMs));
        
        // Convert percentage to pixel position
        const position = positionPercentage * width;
        
        return {
          ...scrobble,
          position
        };
      });
    };
    
    /**
     * Generates time markers for the timeline based on the selected time range
     * 
     * Adapts the interval between markers based on the time range duration:
     * - For hours: 15-30 minute intervals
     * - For days: hourly intervals
     * - For weeks: daily intervals
     * - For months: 3-4 day intervals
     * - For years: weekly or monthly intervals
     * 
     * @param width - The calculated width of the timeline
     * @returns Array of time markers with position and label information
     */
    const generateTimeMarkers = (width: number): TimeMarker[] => {
      const markers: TimeMarker[] = [];
      const timeRangeMs = differenceInMilliseconds(timeRange.end, timeRange.start);
      const daysInRange = differenceInDays(timeRange.end, timeRange.start) + 1;
      
      // Determine appropriate interval based on time range
      let intervalHours: number;
      let formatString: string;
      
      if (daysInRange <= 1) {
        // For a single day, show hourly markers
        intervalHours = 1;
        formatString = 'h:mm a';
      } else if (daysInRange <= 7) {
        // For up to a week, show 6-hour intervals
        intervalHours = 6;
        formatString = 'MMM d, h a';
      } else if (daysInRange <= 31) {
        // For up to a month, show daily markers
        intervalHours = 24;
        formatString = 'MMM d';
      } else {
        // For longer periods, show weekly markers
        intervalHours = 24 * 7;
        formatString = 'MMM d';
      }
      
      // Create a date at the start of the range
      let currentDate = new Date(timeRange.start);
      
      // Generate markers at the calculated interval
      while (currentDate <= timeRange.end) {
        // Calculate position as percentage of time range
        const msFromStart = differenceInMilliseconds(currentDate, timeRange.start);
        const positionPercentage = Math.max(0, Math.min(1, msFromStart / timeRangeMs));
        
        // Convert percentage to pixel position
        const position = positionPercentage * width;
        
        markers.push({
          position,
          label: format(currentDate, formatString),
          date: new Date(currentDate)
        });
        
        // Move to next interval
        currentDate = new Date(currentDate.getTime() + intervalHours * 60 * 60 * 1000);
      }
      
      return markers;
    };
    
    /**
     * Recalculates timeline dimensions and positions when dependencies change
     */
    useEffect(() => {
      // Calculate appropriate timeline width
      const width = calculateTimelineWidth();
      setTimelineWidth(width);
      
      // Position scrobbles on the timeline
      const positioned = positionScrobbles(width);
      setPositionedScrobbles(positioned);
      
      // Generate time markers
      const markers = generateTimeMarkers(width);
      setTimeMarkers(markers);
    }, [scrobbles, timeRange]);
    
    /**
     * Scrolls to a specific scrobble on the timeline
     * 
     * @param scrobble - The scrobble to scroll to
     */
    const scrollToScrobble = (scrobble: Scrobble) => {
      const timelineElement = ref ? (ref as React.RefObject<HTMLDivElement>).current : localTimelineRef.current;
      if (!timelineElement) return;
      
      // Find the positioned scrobble
      const positioned = positionedScrobbles.find(s => s.id === scrobble.id);
      if (!positioned) return;
      
      // Calculate scroll position to center the scrobble in the viewport
      const scrollPosition = positioned.position - (timelineElement.clientWidth / 2);
      
      // Scroll to the position
      timelineElement.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    };
    
    // Scroll to selected scrobble when it changes
    useEffect(() => {
      if (selectedScrobble) {
        scrollToScrobble(selectedScrobble);
      }
    }, [selectedScrobble, positionedScrobbles]);

    return (
      <div className="scrobble-timeline-container overflow-x-auto" ref={ref || localTimelineRef}>
        <div className="timeline-content" style={{ width: `${timelineWidth}px`, minWidth: '100%' }}>
          {/* Time markers */}
          <div className="time-markers">
            {timeMarkers.map((marker, index) => (
              <div 
                key={index}
                className="time-marker" 
                style={{ left: `${marker.position}px` }}
              >
                <div className="marker-line"></div>
                <div className="marker-label">{marker.label}</div>
              </div>
            ))}
          </div>
          
          {/* Timeline track with scrobble points */}
          <div className="timeline-track">
            {positionedScrobbles.map(scrobble => (
              <div 
                key={scrobble.id}
                className={`scrobble-point ${
                  selectedScrobble?.id === scrobble.id ? 'selected' : ''
                } ${
                  hoveredScrobble?.id === scrobble.id ? 'hovered' : ''
                }`}
                style={{ left: `${scrobble.position}px` }}
                onMouseEnter={() => onScrobbleHover(scrobble)}
                onMouseLeave={() => onScrobbleHover(null)}
                onClick={() => onScrobbleSelect(scrobble)}
              >
                <img 
                  src={scrobble.image_url || '/default-album.png'} 
                  alt={`${scrobble.track} by ${scrobble.artist}`} 
                  className="album-art"
                />
                
                {/* Tooltip that appears on hover */}
                <div className="scrobble-tooltip">
                  <div className="tooltip-content">
                    <h4>{scrobble.track}</h4>
                    <p className="artist">{scrobble.artist}</p>
                    {scrobble.album && <p className="album">{scrobble.album}</p>}
                    <p className="time">{format(new Date(scrobble.listened_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty state message */}
          {scrobbles.length === 0 && (
            <div className="empty-timeline-message">
              <p>No scrobbles found for this time period</p>
              <p>Try selecting a different time range</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default ScrobbleTimeline;
