import React, { useRef } from 'react';
import '../styles/ScrobbleTimeline.css';
import { useScrobbleTimeline } from '../hooks/useScrobbleTimeline';
import MUITimeRangeSelector from './MUITimeRangeSelector';
import MUIScrobbleTimeline from './MUIScrobbleTimeline';

/**
 * Props for the ScrobbleTimelineView component
 */
interface ScrobbleTimelineViewProps {
  /**
   * Last.fm username for fetching scrobbles
   */
  username: string;
}

/**
 * Container component that integrates all timeline-related components
 * 
 * This component:
 * 1. Manages the shared state between timeline and list views
 * 2. Handles time range selection
 * 3. Coordinates interactions between components
 * 4. Displays loading and error states
 */
const ScrobbleTimelineView: React.FC<ScrobbleTimelineViewProps> = ({ username }) => {
  // Reference to the timeline component for scroll synchronization
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Use the custom hook to manage scrobble data and interactions
  const {
    loading,
    error,
    scrobbles,
    timeRange,
    setTimeRange,
    selectedScrobble,
    setSelectedScrobble,
    hoveredScrobble,
    setHoveredScrobble
  } = useScrobbleTimeline(username);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary mb-4">Listening Timeline</h2>
      
      {/* Time range selection controls */}
      <div className="card shadow-sm p-4">
        <MUITimeRangeSelector 
          currentRange={timeRange}
          onRangeChange={setTimeRange}
        />
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-lg text-secondary">Loading your scrobbles...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <div className="alert alert-danger">
          <h3 className="font-semibold mb-2">Error Loading Scrobbles</h3>
          <p>{error}</p>
        </div>
      )}
      
      {/* Timeline container */}
      {!loading && !error && scrobbles.length > 0 && (
        <div className="w-full">
          <div className="card shadow">
            <div className="card-body p-4">
              <MUIScrobbleTimeline
                scrobbles={scrobbles}
                timeRange={timeRange}
                onScrobbleHover={setHoveredScrobble}
                onScrobbleSelect={setSelectedScrobble}
                selectedScrobble={selectedScrobble}
                hoveredScrobble={hoveredScrobble}
                ref={timelineRef}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && !error && scrobbles.length === 0 && (
        <div className="card shadow p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No Scrobbles Found</h3>
          <p className="text-tertiary mb-2">No listening data found for the selected time period.</p>
          <p className="text-tertiary">Try selecting a different time range or check your Last.fm account.</p>
        </div>
      )}
    </div>
  );
};

export default ScrobbleTimelineView;
