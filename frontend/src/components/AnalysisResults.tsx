import React, { useState } from 'react';
import '../styles/AnalysisResults.css';
import { AnalysisSummary } from '../types';
import ArtistTrendChart from './ArtistTrendChart';
import GenreDistributionChart from './GenreDistributionChart';
import ListeningActivityHeatmap from './ListeningActivityHeatmap';
import ScrobbleTimelineView from './ScrobbleTimelineView';
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

  // State to track which view is currently active
  const [activeView, setActiveView] = useState<string>('timeline');
  
  // Available views - can be easily extended with more views
  const views = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'list', label: 'List' },
    { id: 'summary', label: 'Summary' },
    { id: 'artists', label: 'Artists' },
    { id: 'genres', label: 'Genres' }
  ];

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">Music Analysis for {analysis.username}</h2>
        <p className="text-sm text-tertiary">
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

      <div className="sticky top-0 z-10 bg-bg-primary shadow-sm mb-8">
        <div className="container mx-auto">
          <nav className="flex overflow-x-auto hide-scrollbar" aria-label="View options">
            {views.map(view => (
              <button 
                key={view.id}
                className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                  activeView === view.id 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-tertiary hover:text-secondary'
                }`}
                onClick={() => setActiveView(view.id)}
                aria-current={activeView === view.id ? 'page' : undefined}
              >
                {view.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="fade-in">
        {activeView === 'timeline' && (
          <ScrobbleTimelineView username={analysis.username} />
        )}
        
        {activeView === 'list' && (
          <div className="card shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Scrobble List View</h3>
            <p className="text-tertiary">This view will show a detailed list of all scrobbles.</p>
          </div>
        )}
        
        {activeView === 'artists' && (
          <div className="card shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Artists View</h3>
            <p className="text-tertiary">This view will show detailed artist statistics and trends.</p>
          </div>
        )}
        
        {activeView === 'genres' && (
          <div className="card shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Genres View</h3>
            <p className="text-tertiary">This view will show genre distribution and trends.</p>
          </div>
        )}
        
        {activeView === 'summary' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="card shadow p-4 text-center">
                <h3 className="text-sm font-medium text-tertiary mb-1">Total Scrobbles</h3>
                <div className="text-3xl font-bold text-primary">{analysis.total_scrobbles}</div>
              </div>
              <div className="card shadow p-4 text-center">
                <h3 className="text-sm font-medium text-tertiary mb-1">Unique Artists</h3>
                <div className="text-3xl font-bold text-primary">{analysis.unique_artists}</div>
              </div>
              <div className="card shadow p-4 text-center">
                <h3 className="text-sm font-medium text-tertiary mb-1">Unique Tracks</h3>
                <div className="text-3xl font-bold text-primary">{analysis.unique_tracks}</div>
              </div>
              <div className="card shadow p-4 text-center">
                <h3 className="text-sm font-medium text-tertiary mb-1">New Discoveries</h3>
                <div className="text-3xl font-bold text-primary">{analysis.new_artists_discovered}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card shadow">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Artist Trends Over Time</h3>
                </div>
                <div className="card-body">
                  <ArtistTrendChart periodAnalysis={analysis.period_analysis} />
                </div>
              </div>

              {analysis.genre_distribution && analysis.genre_distribution.length > 0 && (
                <div className="card shadow">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Genre Distribution</h3>
                  </div>
                  <div className="card-body">
                    <GenreDistributionChart genreDistribution={analysis.genre_distribution} />
                  </div>
                </div>
              )}

              <div className="card shadow">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Listening Activity</h3>
                </div>
                <div className="card-body">
                  <ListeningActivityHeatmap activities={activities} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
