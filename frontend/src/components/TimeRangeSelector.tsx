import React from 'react';
import { TimeRange } from '../hooks/useScrobbleTimeline';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

/**
 * Props for the TimeRangeSelector component
 */
interface TimeRangeSelectorProps {
  /**
   * Current selected time range
   */
  currentRange: TimeRange;
  
  /**
   * Callback function to update the time range
   */
  onRangeChange: (range: TimeRange) => void;
}

/**
 * Component for selecting a time range for the timeline view
 * 
 * Provides preset options for common time periods (day, week, month, etc.)
 * and allows for custom date range selection.
 */
const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ 
  currentRange, 
  onRangeChange 
}) => {
  /**
   * Creates a time range for a preset period
   * 
   * @param days - Number of days to look back (optional)
   * @param weeks - Number of weeks to look back (optional)
   * @param months - Number of months to look back (optional)
   * @returns The calculated time range
   */
  const createTimeRange = (days?: number, weeks?: number, months?: number): TimeRange => {
    const end = endOfDay(new Date());
    let start;
    
    if (days) {
      start = startOfDay(subDays(end, days));
    } else if (weeks) {
      start = startOfDay(subWeeks(end, weeks));
    } else if (months) {
      start = startOfDay(subMonths(end, months));
    } else {
      // Default to 1 week if no parameters provided
      start = startOfDay(subWeeks(end, 1));
    }
    
    return { start, end };
  };

  /**
   * Handles click on a preset time range button
   * 
   * @param days - Number of days to look back (optional)
   * @param weeks - Number of weeks to look back (optional)
   * @param months - Number of months to look back (optional)
   */
  const handlePresetClick = (days?: number, weeks?: number, months?: number) => {
    const newRange = createTimeRange(days, weeks, months);
    onRangeChange(newRange);
  };

  /**
   * Handles change in the custom date inputs
   * 
   * @param event - The change event
   * @param isStart - Whether the changed input is the start date (true) or end date (false)
   */
  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    isStart: boolean
  ) => {
    const dateValue = event.target.value;
    if (!dateValue) return;
    
    const newDate = new Date(dateValue);
    
    // Create a new range object with either start or end date updated
    const newRange = {
      start: isStart ? newDate : currentRange.start,
      end: isStart ? currentRange.end : newDate
    };
    
    onRangeChange(newRange);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-primary">Select Time Period</h3>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => handlePresetClick(1)} 
          className={`btn ${currentRange.start.getTime() === createTimeRange(1).start.getTime() 
            ? 'btn-primary' 
            : 'btn-secondary'}`}
        >
          Last 24 Hours
        </button>
        <button 
          onClick={() => handlePresetClick(0, 1)} 
          className={`btn ${currentRange.start.getTime() === createTimeRange(0, 1).start.getTime() 
            ? 'btn-primary' 
            : 'btn-secondary'}`}
        >
          Last Week
        </button>
        <button 
          onClick={() => handlePresetClick(0, 2)} 
          className={`btn ${currentRange.start.getTime() === createTimeRange(0, 2).start.getTime() 
            ? 'btn-primary' 
            : 'btn-secondary'}`}
        >
          Last 2 Weeks
        </button>
        <button 
          onClick={() => handlePresetClick(0, 0, 1)} 
          className={`btn ${currentRange.start.getTime() === createTimeRange(0, 0, 1).start.getTime() 
            ? 'btn-primary' 
            : 'btn-secondary'}`}
        >
          Last Month
        </button>
        <button 
          onClick={() => handlePresetClick(0, 0, 3)} 
          className={`btn ${currentRange.start.getTime() === createTimeRange(0, 0, 3).start.getTime() 
            ? 'btn-primary' 
            : 'btn-secondary'}`}
        >
          Last 3 Months
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-bg-secondary rounded-lg">
        <h4 className="text-md font-medium mb-3 text-secondary">Custom Range</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="start-date" className="form-label">From:</label>
            <input
              id="start-date"
              type="date"
              className="form-control"
              value={currentRange.start.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e, true)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="end-date" className="form-label">To:</label>
            <input
              id="end-date"
              type="date"
              className="form-control"
              value={currentRange.end.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e, false)}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRangeSelector;
