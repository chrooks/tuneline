import { useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { GenreDistribution } from '../types';

// Register all Chart.js components
ChartJS.register(...registerables);

interface GenreDistributionChartProps {
  genreDistribution?: GenreDistribution[];
}

const GenreDistributionChart: React.FC<GenreDistributionChartProps> = ({ 
  genreDistribution = [] 
}) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    // Generate colors for each genre
    const colors = genreDistribution.map((_, index) => {
      const hue = (index * 30) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    });

    return {
      labels: genreDistribution.map(genre => genre.genre),
      datasets: [
        {
          data: genreDistribution.map(genre => genre.count),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('60%', '40%')),
          borderWidth: 1,
        },
      ],
    };
  }, [genreDistribution]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Genre Distribution',
      },
    },
  };

  if (!genreDistribution || genreDistribution.length === 0) {
    return <div className="chart-container empty">No genre data available</div>;
  }

  return (
    <div className="chart-container">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default GenreDistributionChart;
