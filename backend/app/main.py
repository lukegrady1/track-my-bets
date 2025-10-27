from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.api.v1 import auth, bets, analytics, imports, sportsbooks, users

# Create FastAPI application
app = FastAPI(
    title="Track My Bets API",
    version="1.0.0",
    description="REST API for tracking sports betting performance"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Initialize application on startup."""
    await init_db()


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": "Track My Bets API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(bets.router, prefix="/api/v1/bets", tags=["bets"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(imports.router, prefix="/api/v1/imports", tags=["imports"])
app.include_router(sportsbooks.router, prefix="/api/v1/sportsbooks", tags=["sportsbooks"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
