from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Candidate
from schemas import CandidateCreate, CandidateUpdate, CandidateResponse

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("/project/{project_id}", response_model=List[CandidateResponse])
def get_candidates_by_project(project_id: int, db: Session = Depends(get_db)):
    """Get all candidates for a specific project"""
    candidates = db.query(Candidate).filter(Candidate.project_id == project_id).all()
    return candidates

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get a specific candidate by ID"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@router.post("/", response_model=CandidateResponse)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    """Create a new candidate"""
    db_candidate = Candidate(**candidate.model_dump())
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: int, candidate: CandidateUpdate, db: Session = Depends(get_db)):
    """Update an existing candidate"""
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    for key, value in candidate.model_dump(exclude_unset=True).items():
        setattr(db_candidate, key, value)
    
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate"""
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    db.delete(db_candidate)
    db.commit()
    return {"message": "Candidate deleted successfully"}
