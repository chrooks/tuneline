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
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-primary">Analyze Your Last.fm History</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="username" className="form-label">Last.fm Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Last.fm username"
            required
            disabled={isLoading}
            className="form-control"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="startDate" className="form-label">Start Date (Optional)</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate" className="form-label">End Date (Optional)</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              className="form-control"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button 
            type="submit" 
            className={`btn btn-primary ${isLoading ? 'opacity-70' : ''}`}
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LastfmForm;
