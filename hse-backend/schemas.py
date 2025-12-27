from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time

# User/Auth Schemas
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DeleteVerify(BaseModel):
    pin: str

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    location: Optional[str] = None
    company: Optional[str] = None
    hse_lead_name: Optional[str] = None
    hse_lead_photo: Optional[str] = None
    manpower: int = 0
    man_hours: int = 0
    new_inductions: int = 0
    high_risk: List[str] = []
    delete_pin: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    
    class Config:
        from_attributes = True

# Candidate Schemas
class CandidateBase(BaseModel):
    name: str
    photo: Optional[str] = None
    role: Optional[str] = None
    display_order: int = 0

class CandidateCreate(CandidateBase):
    project_id: int

class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    photo: Optional[str] = None
    role: Optional[str] = None
    display_order: Optional[int] = None

class CandidateResponse(CandidateBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

class CandidateReorder(BaseModel):
    candidate_ids: List[int]  # List of candidate IDs in new order

# Daily Log Schemas
class DailyLogBase(BaseModel):
    log_date: date
    time_in: Optional[time] = None
    time_out: Optional[time] = None
    
    # Original fields
    task_briefing: Optional[bool] = None
    tbt_conducted: Optional[bool] = None
    violation_briefing: Optional[bool] = None
    checklist_submitted: Optional[bool] = None
    
    # New fields
    inductions_covered: Optional[bool] = None
    barcode_implemented: Optional[bool] = None
    attendance_verified: Optional[bool] = None
    safety_observations_recorded: Optional[bool] = None
    sor_ncr_closed: Optional[bool] = None
    mock_drill_participated: Optional[bool] = None
    campaign_participated: Optional[bool] = None
    monthly_inspections_completed: Optional[bool] = None
    near_miss_reported: Optional[bool] = None
    weekly_training_briefed: Optional[bool] = None
    
    # Additional 10 new fields
    daily_reports_followup: Optional[bool] = None
    msra_communicated: Optional[bool] = None
    consultant_responses: Optional[bool] = None
    weekly_tbt_full_participation: Optional[bool] = None
    welfare_facilities_monitored: Optional[bool] = None
    monday_ncr_shared: Optional[bool] = None
    safety_walks_conducted: Optional[bool] = None
    training_sessions_conducted: Optional[bool] = None
    barcode_system_100: Optional[bool] = None
    task_briefings_participating: Optional[bool] = None
    
    # Comment and description
    comment: Optional[str] = None
    description: Optional[str] = None

class DailyLogCreate(DailyLogBase):
    candidate_id: int

class DailyLogResponse(DailyLogBase):
    id: int
    candidate_id: int
    
    class Config:
        from_attributes = True

# Monthly KPI Schemas
class MonthlyKPIBase(BaseModel):
    month: date
    observations_open: int = 0
    observations_closed: int = 0
    violations: int = 0
    ncrs_open: int = 0
    ncrs_closed: int = 0
    weekly_reports_open: int = 0
    weekly_reports_closed: int = 0

class MonthlyKPICreate(MonthlyKPIBase):
    candidate_id: int

class MonthlyKPIResponse(MonthlyKPIBase):
    id: int
    candidate_id: int
    
    class Config:
        from_attributes = True

# Monthly Activity Schemas
class MonthlyActivityBase(BaseModel):
    month: date
    mock_drill: bool = False
    campaign_type: Optional[str] = None
    campaign_completed: bool = False
    inspection_power_tools: bool = False
    inspection_plant_equipment: bool = False
    inspection_tools_accessories: bool = False
    near_miss_recorded: bool = False

class MonthlyActivityCreate(MonthlyActivityBase):
    project_id: int

class MonthlyActivityResponse(MonthlyActivityBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True