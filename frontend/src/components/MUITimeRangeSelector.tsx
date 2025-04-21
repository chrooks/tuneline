import React, { useState } from 'react';
import { TimeRange } from '../hooks/useScrobbleTimeline';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { styled } from '@mui/material/styles';

/**
 * Props for the MUITimeRangeSelector component
 */
interface MUITimeRangeSelectorProps {
  /**
   * The current time range
   */
  currentRange: TimeRange;
  
  /**
   * Callback function when the time range changes
   */
  onRangeChange: (range: TimeRange) => void;
}

// Styled components
const RangeButton = styled(Button)(() => ({
  minWidth: '100px',
  padding: '8px 16px',
  borderRadius: 'var(--border-radius-md)',
  '&.active': {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-white)',
    '&:hover': {
      backgroundColor: 'var(--color-primary-dark)',
    },
  },
}));

/**
 * Component that provides time range selection controls using MUI X Date Pickers
 * 
 * Features:
 * - Quick selection buttons for common time ranges
 * - Custom date range selection with date pickers
 * - Responsive design
 */
const MUITimeRangeSelector: React.FC<MUITimeRangeSelectorProps> = ({
  currentRange,
  onRangeChange
}) => {
  // State for custom date range
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs(currentRange.start));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(currentRange.end));
  
  // Update date pickers when currentRange changes
  React.useEffect(() => {
    setStartDate(dayjs(currentRange.start));
    setEndDate(dayjs(currentRange.end));
  }, [currentRange]);
  
  // Predefined time ranges
  const timeRanges = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last Year', days: 365 },
  ];
  
  /**
   * Handles click on a predefined time range button
   * 
   * @param days - Number of days to go back from today
   */
  const handleRangeClick = (days: number) => {
    // Create a new end date set to today at 23:59:59.999
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    // Create a new start date set to 'days' ago at 00:00:00.000
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    
    const newRange: TimeRange = { start, end };
    
    // Update state
    setStartDate(dayjs(start));
    setEndDate(dayjs(end));
    onRangeChange(newRange);
  };
  
  /**
   * Handles change of the start date picker
   * 
   * @param date - New start date
   */
  const handleStartDateChange = (date: Dayjs | null) => {
    if (date) {
      setStartDate(date);
      
      // Create a new date object with time set to 00:00:00
      const start = date.toDate();
      start.setHours(0, 0, 0, 0);
      
      // Keep the end date the same
      const end = new Date(currentRange.end);
      
      // Only update if the start date is before or equal to the end date
      if (start <= end) {
        onRangeChange({ start, end });
      }
    }
  };
  
  /**
   * Handles change of the end date picker
   * 
   * @param date - New end date
   */
  const handleEndDateChange = (date: Dayjs | null) => {
    if (date) {
      setEndDate(date);
      
      // Create a new date object with time set to 23:59:59
      const end = date.toDate();
      end.setHours(23, 59, 59, 999);
      
      // Keep the start date the same
      const start = new Date(currentRange.start);
      
      // Only update if the end date is after or equal to the start date
      if (end >= start) {
        onRangeChange({ start, end });
      }
    }
  };
  
  /**
   * Checks if a predefined range is currently active
   * 
   * @param days - Number of days in the range
   * @returns True if the range is active
   */
  const isRangeActive = (days: number): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - days);
    pastDate.setHours(0, 0, 0, 0);
    
    // Check if the current range matches this predefined range
    const startMatches = Math.abs(currentRange.start.getTime() - pastDate.getTime()) < 86400000; // Within 1 day
    const endMatches = Math.abs(currentRange.end.getTime() - today.getTime()) < 86400000; // Within 1 day
    
    return startMatches && endMatches;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Select Time Range
        </Typography>
        
        {/* Quick selection buttons */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 3 }}
          justifyContent="center"
        >
          {timeRanges.map(range => (
            <RangeButton
              key={range.days}
              variant="outlined"
              className={isRangeActive(range.days) ? 'active' : ''}
              onClick={() => handleRangeClick(range.days)}
            >
              {range.label}
            </RangeButton>
          ))}
        </Stack>
        
        {/* Custom date range pickers */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          alignItems="center"
          justifyContent="center"
        >
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            maxDate={endDate || undefined}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
                size: 'small',
              },
            }}
          />
          
          <Typography variant="body1" sx={{ mx: 1 }}>
            to
          </Typography>
          
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            minDate={startDate || undefined}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
                size: 'small',
              },
            }}
          />
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default MUITimeRangeSelector;
