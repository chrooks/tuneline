import { useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { PeriodAnalysis } from '../types';

// Register all Chart.js components
ChartJS.register(...registerables);

interface ArtistTrendChartProps {
  periodAnalysis: PeriodAnalysis[];
}

const ArtistTrendChart: React.FC<ArtistTrendChartProps> = ({ periodAnalysis }) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    // Sort periods chronologically
    const sortedPeriods = [...periodAnalysis].sort((a, b) => {
      return a.period.localeCompare(b.period);
    });

    // Get all unique artists across all periods
    const allArtists = new Set<string>();
    sortedPeriods.forEach(period => {
      period.top_artists.slice(0, 5).forEach(artist => {
        allArtists.add(artist.artist);
      });
    });

    // Convert to array and take top 5 most frequent artists
    const topArtists = Array.from(allArtists).slice(0, 5);

    // Create datasets for each artist
    const datasets = topArtists.map((artist, index) => {
      const data = sortedPeriods.map(period => {
        const artistData = period.top_artists.find(a => a.artist === artist);
        return artistData ? artistData.play_count : 0;
      });

      // Generate a color based on index
      const hue = (index * 70) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;

      return {
        label: artist,
        data,
        backgroundColor: color,
        borderColor: `hsl(${hue}, 70%, 40%)`,
        borderWidth: 1,
      };
    });

    return {
      labels: sortedPeriods.map(period => {
        // Format period (YYYY-MM) to be more readable
        const [year, month] = period.period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }),
      datasets,
    };
  }, [periodAnalysis]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Artist Play Count Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time Period',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Play Count',
        },
        beginAtZero: true,
      },
    },
  };

  if (!periodAnalysis || periodAnalysis.length === 0) {
    return <div className="chart-container empty">No data available</div>;
  }

  return (
    <div className="chart-container">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ArtistTrendChart;
