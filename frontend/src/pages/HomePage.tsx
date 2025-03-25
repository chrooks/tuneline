import React, { useState } from 'react';
import LastfmForm from '../components/LastfmForm';
import AnalysisResults from '../components/AnalysisResults';
import { useLastfmAnalysis } from '../hooks/useLastfmAnalysis';
import { AnalysisRequest } from '../types';

const HomePage: React.FC = () => {
  const { loading, error, analysisSummary, analyzeLastfmUser } = useLastfmAnalysis();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (request: AnalysisRequest) => {
    setHasSubmitted(true);
    await analyzeLastfmUser(request);
  };

  return (
    <div className="home-page">
      <header className="app-header">
        <h1>Tuneline</h1>
        <p className="tagline">Visualize your music journey through time</p>
      </header>

      <div className="content-container">
        <div className="form-container">
          <LastfmForm onSubmit={handleSubmit} isLoading={loading} />
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing your Last.fm data. This may take a moment...</p>
          </div>
        )}

        {error && hasSubmitted && !loading && (
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {analysisSummary && !loading && (
          <div className="results-container">
            <AnalysisResults analysis={analysisSummary} />
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>
          Tuneline &copy; {new Date().getFullYear()} | Powered by{' '}
          <a href="https://www.last.fm/api" target="_blank" rel="noopener noreferrer">
            Last.fm API
          </a>
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
