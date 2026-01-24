"""
Script to link existing projects to users based on the hse_lead_name string.
This fixes Approach A (Project Isolation) for legacy data.
"""
from database import SessionLocal
from models import Project, User, ProjectUser

def migrate_assignments():
    db = SessionLocal()
    
    # 1. Get all projects
    projects = db.query(Project).all()
    print(f"Found {len(projects)} projects.")
    
    assigned_count = 0
    
    for proj in projects:
        # Skip if already has assignments
        existing_assignment = db.query(ProjectUser).filter(ProjectUser.project_id == proj.id).first()
        if existing_assignment:
            continue
            
        # Try to find a user with a matching name or username
        lead_name = proj.hse_lead_name
        if not lead_name:
            continue
            
        # Match by full_name or username (case insensitive)
        user = db.query(User).filter(
            (User.full_name.ilike(f"%{lead_name}%")) | 
            (User.username.ilike(f"%{lead_name}%"))
        ).first()
        
        if user:
            # Create the link
            new_link = ProjectUser(user_id=user.id, project_id=proj.id)
            db.add(new_link)
            print(f"✅ Linked project '{proj.name}' to user '{user.username}' (Matched '{lead_name}')")
            assigned_count += 1
        else:
            # Fallback: If no match, and it's an admin-created project, maybe assign to org owner?
            # For now, let's just log it
            print(f"❓ Could not find user for lead name '{lead_name}' in project '{proj.name}'")

    db.commit()
    db.close()
    print(f"\nDone! Assigned {assigned_count} projects to users.")

if __name__ == "__main__":
    migrate_assignments()
