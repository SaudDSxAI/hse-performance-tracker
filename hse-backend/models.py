from sqlalchemy import Column, Integer, String, Boolean, JSON, Date, Time, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String)
    company = Column(String)
    hse_lead_name = Column(String)
    hse_lead_photo = Column(String)
    manpower = Column(Integer, default=0)
    man_hours = Column(Integer, default=0)
    new_inductions = Column(Integer, default=0)
    high_risk = Column(JSON, default=[])
    delete_pin = Column(String, nullable=True)  # PIN required to delete project

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    photo = Column(String)
    role = Column(String)
    display_order = Column(Integer, default=0)

class DailyLog(Base):
    __tablename__ = "daily_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    log_date = Column(Date, nullable=False)
    time_in = Column(Time)
    time_out = Column(Time)
    
    # Original fields (now nullable for Yes/No/Empty)
    task_briefing = Column(Boolean, nullable=True)
    tbt_conducted = Column(Boolean, nullable=True)
    violation_briefing = Column(Boolean, nullable=True)
    checklist_submitted = Column(Boolean, nullable=True)
    
    # New fields
    inductions_covered = Column(Boolean, nullable=True)           # New inductions covered this week?
    barcode_implemented = Column(Boolean, nullable=True)          # Bar code implemented 100%?
    attendance_verified = Column(Boolean, nullable=True)          # Time IN/OUT verified?
    safety_observations_recorded = Column(Boolean, nullable=True) # At least 2 safety observations today?
    sor_ncr_closed = Column(Boolean, nullable=True)               # Closed 90% SOR/NCRs this week?
    mock_drill_participated = Column(Boolean, nullable=True)      # Participated in mock drill this month?
    campaign_participated = Column(Boolean, nullable=True)        # Participated in campaign this month?
    monthly_inspections_completed = Column(Boolean, nullable=True)# Monthly inspections 100% completed?
    near_miss_reported = Column(Boolean, nullable=True)           # Near miss reported this month?
    weekly_training_briefed = Column(Boolean, nullable=True)      # Weekly training briefed to workers?
    
    # Comment and description
    comment = Column(String(255), nullable=True)
    description = Column(String, nullable=True)

class MonthlyKPI(Base):
    __tablename__ = "monthly_kpis"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    month = Column(Date, nullable=False)
    observations_open = Column(Integer, default=0)
    observations_closed = Column(Integer, default=0)
    violations = Column(Integer, default=0)
    ncrs_open = Column(Integer, default=0)
    ncrs_closed = Column(Integer, default=0)
    weekly_reports_open = Column(Integer, default=0)
    weekly_reports_closed = Column(Integer, default=0)

class MonthlyActivity(Base):
    __tablename__ = "monthly_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    month = Column(Date, nullable=False)
    mock_drill = Column(Boolean, default=False)
    campaign_type = Column(String)
    campaign_completed = Column(Boolean, default=False)
    inspection_power_tools = Column(Boolean, default=False)
    inspection_plant_equipment = Column(Boolean, default=False)
    inspection_tools_accessories = Column(Boolean, default=False)
    near_miss_recorded = Column(Boolean, default=False)