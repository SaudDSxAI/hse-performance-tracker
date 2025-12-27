from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Section, CandidateSection
from schemas import (
    SectionCreate, SectionUpdate, SectionResponse, SectionReorder,
    CandidateSectionCreate, CandidateSectionResponse
)

router = APIRouter(prefix="/api/sections", tags=["Sections"])

# ==================== SECTIONS ====================

@router.get("/project/{project_id}", response_model=List[SectionResponse])
def get_sections_by_project(project_id: int, db: Session = Depends(get_db)):
    """Get all sections for a specific project, ordered by display_order"""
    sections = db.query(Section).filter(
        Section.project_id == project_id
    ).order_by(Section.display_order).all()
    return sections

@router.get("/{section_id}", response_model=SectionResponse)
def get_section(section_id: int, db: Session = Depends(get_db)):
    """Get a specific section by ID"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

@router.post("/", response_model=SectionResponse)
def create_section(section: SectionCreate, db: Session = Depends(get_db)):
    """Create a new section"""
    # Get max display_order for this project
    max_order = db.query(Section).filter(
        Section.project_id == section.project_id
    ).count()
    
    # Create section data
    section_data = section.model_dump()
    section_data['display_order'] = max_order
    
    db_section = Section(**section_data)
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section

@router.put("/{section_id}", response_model=SectionResponse)
def update_section(section_id: int, section: SectionUpdate, db: Session = Depends(get_db)):
    """Update an existing section"""
    db_section = db.query(Section).filter(Section.id == section_id).first()
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    for key, value in section.model_dump(exclude_unset=True).items():
        setattr(db_section, key, value)
    
    db.commit()
    db.refresh(db_section)
    return db_section

@router.delete("/{section_id}")
def delete_section(section_id: int, db: Session = Depends(get_db)):
    """Delete a section (also removes all candidate associations)"""
    db_section = db.query(Section).filter(Section.id == section_id).first()
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    db.delete(db_section)
    db.commit()
    return {"message": "Section deleted successfully"}

@router.put("/project/{project_id}/reorder")
def reorder_sections(project_id: int, reorder: SectionReorder, db: Session = Depends(get_db)):
    """Reorder sections for a project"""
    for index, section_id in enumerate(reorder.section_ids):
        section = db.query(Section).filter(
            Section.id == section_id,
            Section.project_id == project_id
        ).first()
        if section:
            section.display_order = index
    
    db.commit()
    return {"message": "Sections reordered successfully"}

# ==================== CANDIDATE-SECTION ASSOCIATIONS ====================

@router.get("/candidate/{candidate_id}/sections", response_model=List[SectionResponse])
def get_candidate_sections(candidate_id: int, db: Session = Depends(get_db)):
    """Get all sections that a candidate belongs to"""
    candidate_sections = db.query(CandidateSection).filter(
        CandidateSection.candidate_id == candidate_id
    ).all()
    
    section_ids = [cs.section_id for cs in candidate_sections]
    sections = db.query(Section).filter(Section.id.in_(section_ids)).all()
    return sections

@router.get("/{section_id}/candidates")
def get_section_candidates(section_id: int, db: Session = Depends(get_db)):
    """Get all candidate IDs in a specific section"""
    candidate_sections = db.query(CandidateSection).filter(
        CandidateSection.section_id == section_id
    ).all()
    
    candidate_ids = [cs.candidate_id for cs in candidate_sections]
    return {"candidate_ids": candidate_ids}

@router.post("/assign", response_model=CandidateSectionResponse)
def assign_candidate_to_section(assignment: CandidateSectionCreate, db: Session = Depends(get_db)):
    """Assign a candidate to a section"""
    # Check if already assigned
    existing = db.query(CandidateSection).filter(
        CandidateSection.candidate_id == assignment.candidate_id,
        CandidateSection.section_id == assignment.section_id
    ).first()
    
    if existing:
        return existing  # Already assigned, return existing
    
    db_assignment = CandidateSection(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/unassign/{candidate_id}/{section_id}")
def unassign_candidate_from_section(candidate_id: int, section_id: int, db: Session = Depends(get_db)):
    """Remove a candidate from a section"""
    assignment = db.query(CandidateSection).filter(
        CandidateSection.candidate_id == candidate_id,
        CandidateSection.section_id == section_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return {"message": "Candidate unassigned from section successfully"}