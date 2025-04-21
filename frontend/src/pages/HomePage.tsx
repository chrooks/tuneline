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
    <div className="app-layout fade-in">
      <header className="app-header">
        <div className="container">
          <h1 className="text-3xl font-bold text-light">Tuneline</h1>
          <p className="text-lg text-light opacity-80">Visualize your music journey through time</p>
        </div>
      </header>

      <main className="app-content">
        <div className="container">
          <div className="card mb-6 slide-in-up">
            <div className="card-body">
              <LastfmForm onSubmit={handleSubmit} isLoading={loading} />
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="loading-spinner mb-4"></div>
              <p className="text-lg text-secondary">Analyzing your Last.fm data. This may take a moment...</p>
            </div>
          )}

          {error && hasSubmitted && !loading && (
            <div className="alert alert-danger slide-in-up">
              <h3 className="font-semibold mb-2">Error</h3>
              <p>{error}</p>
            </div>
          )}

          {analysisSummary && !loading && (
            <div className="card shadow-lg slide-in-up">
              <div className="card-body p-0">
                <AnalysisResults analysis={analysisSummary} />
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="text-sm text-light">
            Tuneline &copy; {new Date().getFullYear()} | Powered by{' '}
            <a href="https://www.last.fm/api" target="_blank" rel="noopener noreferrer" className="text-light hover:text-primary-light">
              Last.fm API
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
