import { useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Scatter } from 'react-chartjs-2';
import { format } from 'date-fns';
import { ListeningActivity } from '../types';

// Register all Chart.js components
ChartJS.register(...registerables);

interface ListeningActivityHeatmapProps {
  activities?: ListeningActivity[];
}

const ListeningActivityHeatmap: React.FC<ListeningActivityHeatmapProps> = ({ 
  activities = [] 
}) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    // Convert activities to data points
    const dataPoints = activities.map(activity => {
      const date = new Date(activity.date);
      
      // Calculate color intensity based on track count
      // Find the max track count to normalize
      const maxTrackCount = Math.max(...activities.map(a => a.track_count));
      const normalizedCount = activity.track_count / maxTrackCount;
      
      // Generate a color from blue (low) to red (high)
      const hue = Math.max(0, Math.min(240, 240 * (1 - normalizedCount)));
      const color = `hsla(${hue}, 100%, 50%, 0.7)`;
      
      return {
        x: date.getTime(),
        y: 1, // All points on same y-axis
        r: Math.max(5, Math.min(20, 5 + (15 * normalizedCount))), // Size based on track count
        trackCount: activity.track_count,
        color,
        date: format(date, 'MMM d, yyyy')
      };
    });

    return {
      datasets: [
        {
          label: 'Listening Activity',
          data: dataPoints,
          backgroundColor: dataPoints.map(point => point.color),
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          pointRadius: dataPoints.map(point => point.r),
          pointHoverRadius: dataPoints.map(point => point.r + 2),
        },
      ],
    };
  }, [activities]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Listening Activity Heatmap',
      },
      tooltip: {
        displayColors: false
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: false,
      },
    },
  };

  if (!activities || activities.length === 0) {
    return <div className="chart-container empty">No activity data available</div>;
  }

  return (
    <div className="chart-container">
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default ListeningActivityHeatmap;
