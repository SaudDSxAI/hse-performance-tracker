from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, User
from schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from auth import get_current_active_user

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all projects for the current user's organization (Isolation for Leads & Viewers)"""
    query = db.query(Project).filter(Project.organization_id == current_user.organization_id)
    
    # Approach A: If user is not admin, only show projects assigned to them
    if current_user.role != "admin":
        # Using a subquery to avoid duplicates without needing .distinct() on JSON columns
        query = query.filter(Project.assigned_leads.any(User.id == current_user.id))
    
    return query.all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific project by ID (Scoped to Org & Assignments)"""
    query = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    )
    
    if current_user.role != "admin":
        query = query.filter(Project.assigned_leads.any(User.id == current_user.id))
        
    project = query.first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    return project

@router.post("", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new project (Only Admin/Lead can create)"""
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot create projects")
        
    project_data = project.model_dump(exclude={"assigned_lead_ids"})
    project_data['organization_id'] = current_user.organization_id
    
    db_project = Project(**project_data)
    
    # Handle initial Lead assignment
    if project.assigned_lead_ids:
        leads = db.query(User).filter(User.id.in_(project.assigned_lead_ids)).all()
        db_project.assigned_leads = leads
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int, 
    project: ProjectUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing project (Isolation check)"""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # If not admin, must be explicitly assigned to this project to update it
    if current_user.role != "admin":
        # Check if project is in their assigned list
        is_assigned = db.query(Project).filter(
            Project.id == project_id,
            Project.assigned_leads.any(User.id == current_user.id)
        ).first()
        if not is_assigned:
             raise HTTPException(status_code=403, detail="You are not assigned to manage this project")

    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot update projects")
    
    update_data = project.model_dump(exclude_unset=True)
    
    # Handle Lead assignment changes (Admin Only)
    if "assigned_lead_ids" in update_data:
        if current_user.role != "admin":
             raise HTTPException(status_code=403, detail="Only admins can change lead assignments")
        lead_ids = update_data.pop("assigned_lead_ids")
        leads = db.query(User).filter(User.id.in_(lead_ids)).all()
        db_project.assigned_leads = leads
    
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}")
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a project (Admins Only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete projects")

    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.put("/user/{user_id}/assignments")
def update_user_assignments(
    user_id: int, 
    project_ids: List[int], 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Batch update entries in project_users for a specific user (Admin Only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage assignments")
        
    target_user = db.query(User).filter(
        User.id == user_id, 
        User.organization_id == current_user.organization_id
    ).first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get all projects in org to ensure we don't assign projects from other orgs
    org_projects = db.query(Project).filter(Project.organization_id == current_user.organization_id).all()
    org_project_ids = [p.id for p in org_projects]
    
    # Filter incoming IDs to only those in the organization
    valid_project_ids = [pid for pid in project_ids if pid in org_project_ids]
    
    # Replace assigned projects
    target_user.assigned_projects = [p for p in org_projects if p.id in valid_project_ids]
    
    db.commit()
    return {"message": "Assignments updated", "count": len(valid_project_ids)}


