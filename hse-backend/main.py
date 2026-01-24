from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import AddingProjects
import AddingCandidates
import AddingSections
import AddingDailyLogs
import AuthRoutes

from migrate_db import migrate

# Run migrations for existing tables
try:
    migrate()
except Exception as e:
    print(f"Migration warning: {e}")

# Create new database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HSE Performance Tracker API",
    version="1.0.0"
)

# Rate Limiting
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter_config import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - Allow frontend only
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hse-tracker.up.railway.app",  # New frontend URL
        "http://localhost:3000",
        "http://192.168.43.35:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(AuthRoutes.router)
app.include_router(AddingProjects.router)
app.include_router(AddingCandidates.router)
app.include_router(AddingSections.router)
app.include_router(AddingDailyLogs.router)  # ✅ ADDED DAILY LOGS ROUTER
import DataExport
app.include_router(DataExport.router)

@app.get("/")
def root():
    return {
        "message": "HSE Performance Tracker API",
        "version": "1.0.0",
        "status": "active"
    } 
