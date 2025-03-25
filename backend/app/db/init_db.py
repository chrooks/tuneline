import logging
from sqlalchemy.exc import ProgrammingError
from app.db.database import engine, Base
from app.models import User, Scrobble, ArtistTrend, ListeningActivity

logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database by creating all tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
