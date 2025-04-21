import axios from 'axios';

// In development, use localhost, in production use relative URL for nginx proxy
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  getUser: (userId: number) => api.get(`/users/${userId}`),
  getUserByLastfm: (lastfmUsername: string) => api.get(`/users/by-lastfm/${lastfmUsername}`),
  createUser: (lastfmUsername: string, email?: string, name?: string) => 
    api.post('/users/', { lastfm_username: lastfmUsername, email, name }),
};

// Scrobbles API
export const scrobblesApi = {
  getScrobbles: (userId: number, params?: { 
    skip?: number; 
    limit?: number; 
    start_date?: string; 
    end_date?: string;
  }) => api.get(`/scrobbles/${userId}`, { params }),
  
  fetchScrobbles: (lastfmUsername: string, params?: {
    start_date?: string;
    end_date?: string;
  }) => api.post('/scrobbles/fetch', { 
    lastfm_username: lastfmUsername,
    ...params
  }),
};

// Analysis API
export const analysisApi = {
  analyzeUser: (lastfmUsername: string, params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => api.post('/analysis/analyze', {
    lastfm_username: lastfmUsername,
    ...params
  }),
  
  getArtistTrends: (userId: number, params?: {
    period?: string;
    skip?: number;
    limit?: number;
  }) => api.get(`/analysis/artist-trends/${userId}`, { params }),
  
  getListeningActivity: (userId: number, params?: {
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
  }) => api.get(`/analysis/listening-activity/${userId}`, { params }),
};

export default {
  user: userApi,
  scrobbles: scrobblesApi,
  analysis: analysisApi,
};
