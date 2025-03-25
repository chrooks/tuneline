from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Tuneline API",
    description="API for analyzing Last.fm scrobble data",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Tuneline API"}

# Import and include routers
from app.api.endpoints import users, scrobbles, analysis

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(scrobbles.router, prefix="/api/scrobbles", tags=["scrobbles"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
