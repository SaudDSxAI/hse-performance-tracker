from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from database import get_db
import models
import schemas
from limiter_config import limiter
from auth import (
    get_password_hash, 
    authenticate_user, 
    create_access_token, 
    get_current_user,
    ACCESS_TOKEN_EXPIRE_DAYS
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse)
@limiter.limit("5/minute")
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists if provided
    if user.email:
        existing_email = db.query(models.User).filter(models.User.email == user.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # 1. Create Organization
    org_name = user.company_name
    # Check if company exists (optional, maybe allow duplicates if strict isolation)
    # For now, simplistic unique check
    existing_org = db.query(models.Organization).filter(models.Organization.name == org_name).first()
    if existing_org:
        # In MVP, we might fail or join exist? 
        # SaaS Best Practice: unique org names or allow duplicates but distinct IDs.
        # Let's enforce unique names for simplicity in MVP.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name already registered. Please contact your admin."
        )

    new_org = models.Organization(name=org_name)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # 2. Create new user linked to Organization
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=get_password_hash(user.password),
        is_admin=True, # Legacy support
        role="admin",  # Phase 5: SaaS Role
        organization_id=new_org.id
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Login immediately after registration
    access_token = create_access_token(
        data={"user_id": db_user.id, "username": db_user.username},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"user_id": user.id, "username": user.username},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    data: schemas.UserChangePassword, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current password
    if not authenticate_user(db, current_user.username, data.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.post("/verify-delete-pin/{project_id}")
def verify_delete_pin(
    project_id: int, 
    data: schemas.DeleteVerify, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # If no PIN set, allow delete
    if not project.delete_pin:
        return {"verified": True}
    
    # Verify PIN
    if project.delete_pin == data.pin:
        return {"verified": True}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Incorrect PIN"
        )

# ==================== USER MANAGEMENT (Phase 5) ====================

@router.get("/users", response_model=List[schemas.UserResponse])
def get_organization_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all users in your organization"""
    users = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id
    ).all()
    return users

@router.post("/invite", response_model=schemas.UserResponse)
def invite_user(
    user_data: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Invite/Create a new user for your organization (Admin Only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite users")
    
    # Check if username exists
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    db_user = models.User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        role="viewer", # Default to lowest role
        organization_id=current_user.organization_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove a user from your organization (Admin Only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can remove users")
        
    user_to_delete = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id
    ).first()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found in your organization")
        
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
        
    db.delete(user_to_delete)
    db.commit()
    return {"message": "User removed successfully"}

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a user's role (Admin Only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    
    # Validate role value
    valid_roles = ["admin", "lead", "viewer"]
    if role_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    user_to_update = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id
    ).first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found in your organization")
    
    # Prevent self-demotion (admin removing their own admin)
    if user_to_update.id == current_user.id and role_data.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot demote yourself")
    
    user_to_update.role = role_data.role
    db.commit()
    db.refresh(user_to_update)
    
    return {"message": f"Role updated to {role_data.role}", "user": user_to_update}