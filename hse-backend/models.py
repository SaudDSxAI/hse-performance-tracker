from sqlalchemy import Column, Integer, String, Boolean, JSON, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    # subscription_plan = Column(String, default="free") 
    
    # Relationships
    users = relationship("User", back_populates="organization")
    projects = relationship("Project", back_populates="organization")

# Many-to-Many relationship for Project Isolation (Approach A)
class ProjectUser(Base):
    __tablename__ = "project_users"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True) # Multitenancy link
    
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False) # System level admin (legacy)
    role = Column(String, default="viewer") # SaaS Roles: admin, lead, viewer
    
    # Relationship
    organization = relationship("Organization", back_populates="users")
    assigned_projects = relationship("Project", secondary="project_users", back_populates="assigned_leads")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True) # Multitenancy link
    
    name = Column(String, nullable=False)
    location = Column(String)
    company = Column(String)
    hse_lead_name = Column(String)
    hse_lead_photo = Column(String)
    manpower = Column(Integer, default=0)
    man_hours = Column(Integer, default=0)
    
    # Relationship
    organization = relationship("Organization", back_populates="projects")
    assigned_leads = relationship("User", secondary="project_users", back_populates="assigned_projects")

    new_inductions = Column(Integer, default=0)
    high_risk = Column(JSON, default=[])
    delete_pin = Column(String, nullable=True)  # PIN required to delete project

class Section(Base):
    __tablename__ = "sections"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    display_order = Column(Integer, default=0)

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    photo = Column(String)
    role = Column(String)
    display_order = Column(Integer, default=0)

class CandidateSection(Base):
    __tablename__ = "candidate_sections"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"))

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
    
    # Additional 10 new fields
    daily_reports_followup = Column(Boolean, nullable=True)       # Daily reports follow-up & coordination done?
    msra_communicated = Column(Boolean, nullable=True)            # MSRA communicated to all key personnel?
    consultant_responses = Column(Boolean, nullable=True)         # Immediate responses provided to consultant?
    weekly_tbt_full_participation = Column(Boolean, nullable=True)# Weekly mass TBT with full participation?
    welfare_facilities_monitored = Column(Boolean, nullable=True) # Workforce welfare facilities monitored?
    monday_ncr_shared = Column(Boolean, nullable=True)            # Monday shared all pending NCRs/SORs?
    safety_walks_conducted = Column(Boolean, nullable=True)       # Two site safety walks daily (7AM & 2PM)?
    training_sessions_conducted = Column(Boolean, nullable=True)  # Minimum 2 HSE training sessions per month?
    barcode_system_100 = Column(Boolean, nullable=True)           # Bar code system 100% for Plant/Equipment/PTW?
    task_briefings_participating = Column(Boolean, nullable=True) # Engineers participating task briefings & verifying?
    
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