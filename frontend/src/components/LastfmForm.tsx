import { useState, FormEvent } from 'react';
import { AnalysisRequest } from '../types';

interface LastfmFormProps {
  onSubmit: (request: AnalysisRequest) => void;
  isLoading: boolean;
}

const LastfmForm: React.FC<LastfmFormProps> = ({ onSubmit, isLoading }) => {
  const [username, setUsername] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }
    
    const request: AnalysisRequest = {
      lastfm_username: username.trim(),
    };
    
    if (startDate) {
      request.start_date = startDate;
    }
    
    if (endDate) {
      request.end_date = endDate;
    }
    
    onSubmit(request);
  };

  return (
    <div className="lastfm-form">
      <h2>Analyze Your Last.fm History</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Last.fm Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Last.fm username"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date (Optional)</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date (Optional)</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={isLoading || !username.trim()}
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  );
};

export default LastfmForm;
