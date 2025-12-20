from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Candidate
from schemas import CandidateCreate, CandidateUpdate, CandidateResponse, CandidateReorder

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("/project/{project_id}", response_model=List[CandidateResponse])
def get_candidates_by_project(project_id: int, db: Session = Depends(get_db)):
    """Get all candidates for a specific project, ordered by display_order"""
    candidates = db.query(Candidate).filter(
        Candidate.project_id == project_id
    ).order_by(Candidate.display_order).all()
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
    # Get max display_order for this project
    max_order = db.query(Candidate).filter(
        Candidate.project_id == candidate.project_id
    ).count()
    
    # Create candidate data without display_order from input
    candidate_data = candidate.model_dump()
    candidate_data['display_order'] = max_order  # Override with calculated order
    
    db_candidate = Candidate(**candidate_data)
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

@router.put("/project/{project_id}/reorder")
def reorder_candidates(project_id: int, reorder: CandidateReorder, db: Session = Depends(get_db)):
    """Reorder candidates for a project"""
    for index, candidate_id in enumerate(reorder.candidate_ids):
        candidate = db.query(Candidate).filter(
            Candidate.id == candidate_id,
            Candidate.project_id == project_id
        ).first()
        if candidate:
            candidate.display_order = index
    
    db.commit()
    return {"message": "Candidates reordered successfully"}