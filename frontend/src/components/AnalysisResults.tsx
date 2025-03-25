import React from 'react';
import { AnalysisSummary } from '../types';
import ArtistTrendChart from './ArtistTrendChart';
import GenreDistributionChart from './GenreDistributionChart';
import ListeningActivityHeatmap from './ListeningActivityHeatmap';
import { format } from 'date-fns';

interface AnalysisResultsProps {
  analysis: AnalysisSummary;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis }) => {
  if (!analysis) {
    return null;
  }

  // Convert activities from period_analysis for the heatmap
  const activities = analysis.period_analysis.map((period, index) => {
    // Extract year and month from period (YYYY-MM)
    const [year, month] = period.period.split('-');
    // Create a date for the first day of the month
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    return {
      id: index, // Use numeric index as id
      user_id: 0, // Not needed for display
      date: date.toISOString(),
      track_count: period.total_tracks,
      created_at: new Date().toISOString(),
    };
  });

  return (
    <div className="analysis-results">
      <div className="analysis-header">
        <h2>Music Taste Analysis for {analysis.username}</h2>
        <p className="analysis-period">
          {analysis.period_start && analysis.period_end ? (
            <>
              Period: {format(new Date(analysis.period_start), 'MMM d, yyyy')} to{' '}
              {format(new Date(analysis.period_end), 'MMM d, yyyy')}
            </>
          ) : (
            'All time'
          )}
        </p>
      </div>

      <div className="analysis-stats">
        <div className="stat-card">
          <h3>Total Scrobbles</h3>
          <div className="stat-value">{analysis.total_scrobbles}</div>
        </div>
        <div className="stat-card">
          <h3>Unique Artists</h3>
          <div className="stat-value">{analysis.unique_artists}</div>
        </div>
        <div className="stat-card">
          <h3>Unique Tracks</h3>
          <div className="stat-value">{analysis.unique_tracks}</div>
        </div>
        <div className="stat-card">
          <h3>New Discoveries</h3>
          <div className="stat-value">{analysis.new_artists_discovered}</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Artist Trends Over Time</h3>
          <ArtistTrendChart periodAnalysis={analysis.period_analysis} />
        </div>

        {analysis.genre_distribution && analysis.genre_distribution.length > 0 && (
          <div className="chart-wrapper">
            <h3>Genre Distribution</h3>
            <GenreDistributionChart genreDistribution={analysis.genre_distribution} />
          </div>
        )}

        <div className="chart-wrapper">
          <h3>Listening Activity</h3>
          <ListeningActivityHeatmap activities={activities} />
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
