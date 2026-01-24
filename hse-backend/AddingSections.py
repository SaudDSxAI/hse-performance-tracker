from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Section, CandidateSection, Project, User, Candidate
from schemas import (
    SectionCreate, SectionUpdate, SectionResponse, SectionReorder,
    CandidateSectionCreate, CandidateSectionResponse
)
from auth import get_current_active_user

router = APIRouter(prefix="/api/sections", tags=["Sections"])

def verify_project_access(project_id: int, user: User, db: Session):
    """Ensure user's organization owns the project and user is assigned if not admin"""
    query = db.query(Project).filter(
        Project.id == project_id, 
        Project.organization_id == user.organization_id
    )
    
    if user.role != "admin":
        query = query.filter(Project.assigned_leads.any(User.id == user.id))
        
    project = query.first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized for this project")
    return project

# ==================== SECTIONS ====================

@router.get("/project/{project_id}", response_model=List[SectionResponse])
def get_sections_by_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all sections for a specific project (Scoped to Org)"""
    verify_project_access(project_id, current_user, db)
    
    sections = db.query(Section).filter(
        Section.project_id == project_id
    ).order_by(Section.display_order).all()
    return sections

@router.get("/{section_id}", response_model=SectionResponse)
def get_section(
    section_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific section by ID (Scoped to Org)"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    verify_project_access(section.project_id, current_user, db)
    return section

@router.post("", response_model=SectionResponse)
def create_section(
    section: SectionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new section (Verify Ownership)"""
    verify_project_access(section.project_id, current_user, db)
    
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
def update_section(
    section_id: int, 
    section: SectionUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing section"""
    db_section = db.query(Section).filter(Section.id == section_id).first()
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    verify_project_access(db_section.project_id, current_user, db)
    
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot update sections")
    
    for key, value in section.model_dump(exclude_unset=True).items():
        setattr(db_section, key, value)
    
    db.commit()
    db.refresh(db_section)
    return db_section

@router.delete("/{section_id}")
def delete_section(
    section_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a section (Admins Only)"""
    # Phase 5: RBAC - Only admins can delete
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete sections")

    db_section = db.query(Section).filter(Section.id == section_id).first()

    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    verify_project_access(db_section.project_id, current_user, db)
    
    db.delete(db_section)
    db.commit()
    return {"message": "Section deleted successfully"}

@router.put("/project/{project_id}/reorder")
def reorder_sections(
    project_id: int, 
    reorder: SectionReorder, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reorder sections (Verify Ownership)"""
    verify_project_access(project_id, current_user, db)

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
def get_candidate_sections(
    candidate_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all sections that a candidate belongs to"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    verify_project_access(candidate.project_id, current_user, db)

    candidate_sections = db.query(CandidateSection).filter(
        CandidateSection.candidate_id == candidate_id
    ).all()
    
    section_ids = [cs.section_id for cs in candidate_sections]
    sections = db.query(Section).filter(Section.id.in_(section_ids)).all()
    return sections

@router.get("/{section_id}/candidates")
def get_section_candidates(
    section_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all candidate IDs in a specific section"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    verify_project_access(section.project_id, current_user, db)

    candidate_sections = db.query(CandidateSection).filter(
        CandidateSection.section_id == section_id
    ).all()
    
    candidate_ids = [cs.candidate_id for cs in candidate_sections]
    return {"candidate_ids": candidate_ids}

@router.post("/assign", response_model=CandidateSectionResponse)
def assign_candidate_to_section(
    assignment: CandidateSectionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Assign a candidate to a section (Security check project)"""
    # 1. Check Section exists and belongs to User's Org
    section = db.query(Section).filter(Section.id == assignment.section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    verify_project_access(section.project_id, current_user, db)

    # 2. Check Candidate exists and belongs to Section's Project
    candidate = db.query(Candidate).filter(Candidate.id == assignment.candidate_id).first()
    if not candidate or candidate.project_id != section.project_id:
        raise HTTPException(status_code=400, detail="Invalid candidate for this section/project")

    # 3. Check if already assigned
    existing = db.query(CandidateSection).filter(
        CandidateSection.candidate_id == assignment.candidate_id,
        CandidateSection.section_id == assignment.section_id
    ).first()
    
    if existing:
        return existing 
    
    db_assignment = CandidateSection(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/unassign/{candidate_id}/{section_id}")
def unassign_candidate_from_section(
    candidate_id: int, 
    section_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a candidate from a section (Scoped to Org)"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    verify_project_access(section.project_id, current_user, db)

    assignment = db.query(CandidateSection).filter(
        CandidateSection.candidate_id == candidate_id,
        CandidateSection.section_id == section_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return {"message": "Candidate unassigned from section successfully"}
@router.put("/{section_id}/sync-candidates")
def sync_section_candidates(
    section_id: int, 
    candidate_ids: List[int], 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Sync all candidates for a section to match the provided IDs (Batch Update)"""
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    verify_project_access(section.project_id, current_user, db)
    
    # 1. Remove all existing assignments for this section
    db.query(CandidateSection).filter(CandidateSection.section_id == section_id).delete()
    
    # 2. Add new assignments
    for cid in candidate_ids:
        # Verify candidate exists and belongs to the same project
        cand = db.query(Candidate).filter(Candidate.id == cid, Candidate.project_id == section.project_id).first()
        if cand:
            new_assign = CandidateSection(section_id=section_id, candidate_id=cid)
            db.add(new_assign)
            
    db.commit()
    return {"message": "Section candidates synced successfully", "count": len(candidate_ids)}
