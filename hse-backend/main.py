from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import AddingProjects
import AddingCandidates
import AddingCandidatesMonitoring

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HSE Performance Tracker API",
    version="1.0.0"
)

# CORS - Allow frontend only
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hse-tracker.up.railway.app",  # New frontend URL
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(AddingProjects.router)
app.include_router(AddingCandidates.router)
app.include_router(AddingCandidatesMonitoring.router)

@app.get("/")
def root():
    return {
        "message": "HSE Performance Tracker API",
        "version": "1.0.0",
        "status": "active"
    }