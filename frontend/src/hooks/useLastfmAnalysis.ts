import { useState, useCallback } from 'react';
import { analysisApi, scrobblesApi, userApi } from '../services/api';
import { AnalysisSummary, AnalysisRequest } from '../types';

interface UseLastfmAnalysisReturn {
  loading: boolean;
  error: string | null;
  analysisSummary: AnalysisSummary | null;
  analyzeLastfmUser: (request: AnalysisRequest) => Promise<void>;
}

export const useLastfmAnalysis = (): UseLastfmAnalysisReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);

  const analyzeLastfmUser = useCallback(async (request: AnalysisRequest) => {
    console.log('Starting analysis for:', request);
    setLoading(true);
    setError(null);
    
    try {
      // First check if we already have a user with this Last.fm username
      let userId: number | null = null;
      
      // Try to get user by Last.fm username
      const userResponse = await userApi.getUserByLastfm(request.lastfm_username)
        .catch(() => null); // Ignore error if user doesn't exist
      
      if (userResponse) {
        userId = userResponse.data.id;
      }
      
      // If user doesn't exist, create one
      if (!userId) {
        const createUserResponse = await userApi.createUser(request.lastfm_username);
        userId = createUserResponse.data.id;
      }
      
      // Fetch scrobbles in the background
      await scrobblesApi.fetchScrobbles(request.lastfm_username, {
        start_date: request.start_date,
        end_date: request.end_date
      });
      
      // Analyze the user's data
      console.log('Fetching analysis data...');
      const analysisResponse = await analysisApi.analyzeUser(request.lastfm_username, {
        start_date: request.start_date,
        end_date: request.end_date,
        limit: request.limit
      });
      
      console.log('Analysis data received:', analysisResponse.data);
      setAnalysisSummary(analysisResponse.data);
    } catch (err) {
      console.error('Error analyzing Last.fm user:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    analysisSummary,
    analyzeLastfmUser
  };
};
