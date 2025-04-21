import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tuneline"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres/tuneline")
    
    # Last.fm API
    LASTFM_API_KEY: str = os.getenv("LASTFM_API_KEY", "")
    LASTFM_API_SECRET: str = os.getenv("LASTFM_API_SECRET", "")
    LASTFM_API_URL: str = "http://ws.audioscrobbler.com/2.0/"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    class Config:
        case_sensitive = True

settings = Settings()
