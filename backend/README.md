# Tuneline Backend

A FastAPI backend for the Tuneline application, which analyzes Last.fm scrobble data to show users how their music taste evolves over time.

## Features

- Last.fm API integration to fetch user listening history
- Data processing to identify music listening trends
- PostgreSQL database for storing user data and analysis results
- RESTful API endpoints for the frontend

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL
- Last.fm API key

### Installation

1. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

Edit the `.env` file in the backend directory with your database and Last.fm API credentials.

4. Create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE tuneline;

# Exit PostgreSQL
\q
```

5. Initialize the database:

```bash
# Run migrations
cd backend
alembic upgrade head

# Or use the init_db script
python -m app.db.init_db
```

## Running the Application

Start the development server:

```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access the interactive API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/              # API endpoints
│   │   └── endpoints/    # API route handlers
│   ├── core/             # Core application code
│   ├── db/               # Database setup and session management
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas for request/response validation
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── .env                  # Environment variables
└── main.py               # Application entry point
