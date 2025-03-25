# Tuneline

Tuneline is a web application that analyzes Last.fm scrobble data to show users how their music taste evolves over time.

## Features

- Last.fm API integration to fetch user listening history
- Data processing to identify music listening trends
- Visualization of artist play counts over time
- Genre distribution analysis
- Listening activity heatmap
- PostgreSQL database for storing user data and analysis results

## Project Structure

The project is divided into two main parts:

### Backend (FastAPI)

- RESTful API endpoints for data retrieval and analysis
- Last.fm API integration
- Data processing and analysis
- PostgreSQL database integration

### Frontend (React)

- User interface for entering Last.fm username and time period
- Data visualization using Chart.js
- Responsive design

## Setup

### Prerequisites

- Python 3.11+
- Node.js 16+
- PostgreSQL
- Last.fm API key

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables:

Edit the `.env` file in the backend directory with your database and Last.fm API credentials.

5. Create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE tuneline;

# Exit PostgreSQL
\q
```

6. Initialize the database:

```bash
# Run migrations
alembic upgrade head

# Or use the init_db script
python -m app.db.init_db
```

7. Start the backend server:

```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Usage

1. Open your browser and navigate to http://localhost:5173
2. Enter your Last.fm username
3. Optionally select a time period for analysis
4. View the visualizations of your music listening history

## API Documentation

When the backend server is running, you can access the interactive API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Technologies Used

- **Backend**:
  - FastAPI
  - SQLAlchemy
  - PostgreSQL
  - Alembic (for database migrations)
  - Pydantic (for data validation)

- **Frontend**:
  - React
  - TypeScript
  - Chart.js
  - React Router
  - Axios

## Future Enhancements

- User authentication
- More detailed genre analysis
- Recommendations based on listening patterns
- Social sharing features
- Comparison with other users
