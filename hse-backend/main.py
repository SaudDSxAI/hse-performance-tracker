from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import AddingProjects
import AddingCandidates
import AddingCandidatesMonitoring

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="HSE Performance Tracker API",
    description="Backend API for HSE Performance Tracking System",
    version="1.0.0"
)

# CORS Configuration - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.railway.app",  # Allow all Railway domains
        "*"  # Temporary - we'll restrict this later
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers from other files
app.include_router(AddingProjects.router)
app.include_router(AddingCandidates.router)
app.include_router(AddingCandidatesMonitoring.router)

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "HSE Performance Tracker API is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "active"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}
