from sqlalchemy import Column, Integer, String, Boolean, JSON, Date, Time, ForeignKey
from database import Base

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

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    photo = Column(String)
    role = Column(String)

class DailyLog(Base):
    __tablename__ = "daily_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    log_date = Column(Date, nullable=False)
    time_in = Column(Time)
    time_out = Column(Time)
    task_briefing = Column(Boolean, default=False)
    tbt_conducted = Column(Boolean, default=False)
    violation_briefing = Column(Boolean, default=False)
    checklist_submitted = Column(Boolean, default=False)
    observations_count = Column(Integer, default=0)

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
