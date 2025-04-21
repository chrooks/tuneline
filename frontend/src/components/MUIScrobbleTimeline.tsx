import { forwardRef, useRef, useState } from 'react';
import { Scrobble } from '../types';
import { TimeRange } from '../hooks/useScrobbleTimeline';
import { format } from 'date-fns';

// Material UI imports
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

// Material UI Timeline imports
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { styled } from '@mui/material/styles';

/**
 * Props for the MUIScrobbleTimeline component
 */
interface MUIScrobbleTimelineProps {
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

// Styled components
const StyledTimeline = styled(Timeline)(() => ({
  padding: 0,
  margin: 0,
  '.MuiTimelineItem-root': {
    minHeight: 70,
  },
  '.MuiTimelineContent-root': {
    padding: '0 16px 8px 16px',
  },
  '.MuiTimelineOppositeContent-root': {
    padding: '0 16px 8px 0',
    flex: 0.2,
  },
}));

const AlbumArtDot = styled(TimelineDot)(() => ({
  padding: 0,
  margin: 0,
  boxShadow: 'var(--shadow-md)',
  borderRadius: 'var(--border-radius-md)',
  overflow: 'hidden',
  width: 48,
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all var(--transition-normal) var(--transition-ease)',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: 'var(--shadow-lg)',
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

const ScrobbleItemPaper = styled(Paper)(() => ({
  padding: 16,
  borderRadius: 'var(--border-radius-lg)',
  boxShadow: 'var(--shadow-sm)',
  transition: 'all var(--transition-normal) var(--transition-ease)',
  '&:hover': {
    boxShadow: 'var(--shadow-md)',
    backgroundColor: 'var(--color-bg-secondary)',
  },
  '&.selected': {
    borderLeft: '3px solid var(--color-primary)',
    backgroundColor: 'rgba(29, 185, 84, 0.05)',
  },
  '&.hovered': {
    backgroundColor: 'var(--color-bg-tertiary)',
  },
}));

// Pagination controls
const PaginationContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px 0',
  gap: 8,
}));

const PageButton = styled('button')(() => ({
  padding: '8px 12px',
  borderRadius: 'var(--border-radius-md)',
  border: '1px solid var(--color-border-medium)',
  backgroundColor: 'var(--color-bg-primary)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  transition: 'all var(--transition-normal) var(--transition-ease)',
  '&:hover': {
    backgroundColor: 'var(--color-bg-secondary)',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  '&.active': {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-primary-dark)',
  },
}));

const PageInfo = styled(Typography)(() => ({
  margin: '0 16px',
}));

/**
 * Component that displays scrobbles on a Material UI Timeline with pagination
 * 
 * Features:
 * - Shows album artwork as timeline dots
 * - Displays track, artist, and album information
 * - Supports hover and selection interactions
 * - Paginates results with 25 items per page
 * - Provides navigation controls for pagination
 */
const MUIScrobbleTimeline = forwardRef<HTMLDivElement, MUIScrobbleTimelineProps>(
  function MUIScrobbleTimeline(props, ref) {
    const {
      scrobbles,
      onScrobbleHover,
      onScrobbleSelect,
      selectedScrobble,
      hoveredScrobble
    } = props;
    
    // Create a local ref that we'll use internally
    const localTimelineRef = useRef<HTMLDivElement>(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;
    const totalPages = Math.ceil(scrobbles.length / itemsPerPage);
    
    // Get current page items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = scrobbles.slice(indexOfFirstItem, indexOfLastItem);
    
    // Pagination handlers
    const goToFirstPage = () => setCurrentPage(1);
    const goToPreviousPage = () => setCurrentPage((prev: number) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages));
    const goToLastPage = () => setCurrentPage(totalPages);
    const goToPage = (page: number) => setCurrentPage(page);
    
    /**
     * Formats a date for display in the timeline
     * 
     * @param dateString - ISO date string to format
     * @returns Formatted date string
     */
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return format(date, "h:mm a");
    };
    
    /**
     * Formats a date for display in the timeline opposite content
     * 
     * @param dateString - ISO date string to format
     * @returns Formatted date string
     */
    const formatDateFull = (dateString: string): string => {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    };

    // If there are no scrobbles, show an empty state
    if (scrobbles.length === 0) {
      return (
        <Box 
          ref={ref || localTimelineRef} 
          className="empty-timeline-message"
          sx={{ 
            textAlign: 'center', 
            padding: 4,
            color: 'var(--color-text-tertiary)'
          }}
        >
          <Typography variant="h6">No scrobbles found for this time period</Typography>
          <Typography variant="body1">Try selecting a different time range</Typography>
        </Box>
      );
    }

    return (
      <Box 
        ref={ref || localTimelineRef} 
        sx={{ 
          width: '100%',
          padding: 2
        }}
      >
        {/* Pagination controls - top */}
        <PaginationContainer>
          <PageButton 
            onClick={goToFirstPage} 
            disabled={currentPage === 1}
            title="First Page"
          >
            &laquo;
          </PageButton>
          <PageButton 
            onClick={goToPreviousPage} 
            disabled={currentPage === 1}
            title="Previous Page"
          >
            &lsaquo;
          </PageButton>
          
          {/* Page input and total */}
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 1 && value <= totalPages) {
                goToPage(value);
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (isNaN(value) || value < 1) {
                goToPage(1);
              } else if (value > totalPages) {
                goToPage(totalPages);
              }
            }}
            style={{
              width: '70px',
              padding: '8px 16px',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-border-medium)',
              backgroundColor: 'var(--color-bg-primary)',
              textAlign: 'center',
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
              margin: 0,
            }}
          />
          
          <PageInfo variant="body2">
            of {totalPages}
          </PageInfo>
          
          <PageButton 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            &rsaquo;
          </PageButton>
          <PageButton 
            onClick={goToLastPage} 
            disabled={currentPage === totalPages}
            title="Last Page"
          >
            &raquo;
          </PageButton>
        </PaginationContainer>
        
        <StyledTimeline position="right">
          {currentItems.map((scrobble) => (
            <TimelineItem 
              key={scrobble.id}
              onMouseEnter={() => onScrobbleHover(scrobble)}
              onMouseLeave={() => onScrobbleHover(null)}
              onClick={() => onScrobbleSelect(scrobble)}
            >
              <TimelineOppositeContent color="text.secondary">
                <Typography variant="body2" color="textSecondary">
                  {formatDateFull(scrobble.listened_at)}
                </Typography>
                <Typography variant="caption">
                  {formatDate(scrobble.listened_at)}
                </Typography>
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                <AlbumArtDot>
                  <img 
                    src={scrobble.image_url || '/default-album.png'} 
                    alt={`${scrobble.album || 'Album'}`}
                  />
                </AlbumArtDot>
                <TimelineConnector />
              </TimelineSeparator>
              
              <TimelineContent>
                <ScrobbleItemPaper 
                  elevation={1}
                  className={`
                    ${selectedScrobble?.id === scrobble.id ? 'selected' : ''}
                    ${hoveredScrobble?.id === scrobble.id ? 'hovered' : ''}
                  `}
                >
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {scrobble.track}
                  </Typography>
                  <Typography variant="body1">{scrobble.artist}</Typography>
                  {scrobble.album && (
                    <Typography variant="body2" color="textSecondary">
                      {scrobble.album}
                    </Typography>
                  )}
                </ScrobbleItemPaper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </StyledTimeline>
        
        {/* Pagination controls - bottom */}
        <PaginationContainer>
          <PageButton 
            onClick={goToFirstPage} 
            disabled={currentPage === 1}
            title="First Page"
          >
            &laquo;
          </PageButton>
          <PageButton 
            onClick={goToPreviousPage} 
            disabled={currentPage === 1}
            title="Previous Page"
          >
            &lsaquo;
          </PageButton>
          
          {/* Page input and total */}
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 1 && value <= totalPages) {
                goToPage(value);
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (isNaN(value) || value < 1) {
                goToPage(1);
              } else if (value > totalPages) {
                goToPage(totalPages);
              }
            }}
            style={{
              width: '70px',
              padding: '8px 16px',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--color-border-medium)',
              backgroundColor: 'var(--color-bg-primary)',
              textAlign: 'center',
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
              margin: 0,
            }}
          />
          
          <PageInfo variant="body2">
            of {totalPages}
          </PageInfo>
          
          <PageButton 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            &rsaquo;
          </PageButton>
          <PageButton 
            onClick={goToLastPage} 
            disabled={currentPage === totalPages}
            title="Last Page"
          >
            &raquo;
          </PageButton>
        </PaginationContainer>
      </Box>
    );
  }
);

export default MUIScrobbleTimeline;
