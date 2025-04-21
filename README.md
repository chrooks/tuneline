# Tuneline - Last.fm Music Analysis

Tuneline is a web application that analyzes Last.fm scrobble data to visualize how a user's music taste evolves over time. The application fetches listening history from the Last.fm API, processes this data to identify trends, and presents the results through interactive visualizations.

## Dockerized Application

This project has been containerized using Docker, making it easy to set up and run the entire application stack including:

- Frontend (React)
- Backend (FastAPI)
- Database (PostgreSQL)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Last.fm API credentials (already configured in .env file)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tuneline
   ```

2. Configure environment variables:
   
   The `.env` file contains all necessary environment variables. The Last.fm API credentials are already set, but you may want to change the `SECRET_KEY` for production use.

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

   This will:
   - Build the frontend and backend images
   - Start the PostgreSQL database
   - Run database migrations
   - Start the backend API server
   - Start the frontend web server

4. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development Workflow

### Running in Development Mode

The docker-compose.yml file is configured for development with:
- Volume mounts for live code reloading
- Exposed ports for direct access to services
- Environment variables for development settings

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend
```

### Database Management

The PostgreSQL database is persisted using a Docker volume:

```bash
# Access the database
docker-compose exec postgres psql -U postgres -d tuneline

# Run migrations manually
docker-compose exec backend alembic upgrade head

# Create a new migration
docker-compose exec backend alembic revision -m "description"
```

## Production Deployment

For production deployment, consider:

1. Updating the `.env` file with production credentials
2. Modifying the CORS settings in the backend
3. Setting up proper SSL/TLS certificates
4. Implementing proper logging and monitoring

## Project Structure

- `frontend/`: React frontend application
- `backend/`: FastAPI backend application
- `docker-compose.yml`: Docker Compose configuration
- `.env`: Environment variables
- `backend/Dockerfile`: Backend Docker configuration
- `frontend/Dockerfile`: Frontend Docker configuration
- `frontend/nginx.conf`: Nginx configuration for the frontend

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Ensure the PostgreSQL container is running: `docker-compose ps`
   - Check database logs: `docker-compose logs postgres`

2. **API not accessible**:
   - Verify the backend container is running: `docker-compose ps`
   - Check backend logs: `docker-compose logs backend`

3. **Frontend not loading**:
   - Check frontend container status: `docker-compose ps`
   - View frontend logs: `docker-compose logs frontend`

### Resetting the Environment

If you need to start fresh:

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (will delete database data)
docker-compose down -v

# Rebuild and start
docker-compose up --build
```
