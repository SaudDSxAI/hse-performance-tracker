from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import DailyLog, MonthlyKPI, MonthlyActivity
from schemas import (
    DailyLogCreate, DailyLogResponse,
    MonthlyKPICreate, MonthlyKPIResponse,
    MonthlyActivityCreate, MonthlyActivityResponse
)

router = APIRouter(tags=["Monitoring"])

# Daily Logs
@router.get("/api/candidates/{candidate_id}/daily-logs", response_model=List[DailyLogResponse])
def get_daily_logs(candidate_id: int, db: Session = Depends(get_db)):
    """Get all daily logs for a candidate"""
    logs = db.query(DailyLog).filter(DailyLog.candidate_id == candidate_id).all()
    return logs

@router.post("/api/daily-logs", response_model=DailyLogResponse)
def create_daily_log(log: DailyLogCreate, db: Session = Depends(get_db)):
    """Create a new daily log"""
    db_log = DailyLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# Monthly KPIs
@router.get("/api/candidates/{candidate_id}/monthly-kpis", response_model=List[MonthlyKPIResponse])
def get_monthly_kpis(candidate_id: int, db: Session = Depends(get_db)):
    """Get all monthly KPIs for a candidate"""
    kpis = db.query(MonthlyKPI).filter(MonthlyKPI.candidate_id == candidate_id).all()
    return kpis

@router.post("/api/monthly-kpis", response_model=MonthlyKPIResponse)
def create_monthly_kpi(kpi: MonthlyKPICreate, db: Session = Depends(get_db)):
    """Create a new monthly KPI"""
    db_kpi = MonthlyKPI(**kpi.model_dump())
    db.add(db_kpi)
    db.commit()
    db.refresh(db_kpi)
    return db_kpi

# Monthly Activities
@router.get("/api/projects/{project_id}/monthly-activities", response_model=List[MonthlyActivityResponse])
def get_monthly_activities(project_id: int, db: Session = Depends(get_db)):
    """Get all monthly activities for a project"""
    activities = db.query(MonthlyActivity).filter(MonthlyActivity.project_id == project_id).all()
    return activities

@router.post("/api/monthly-activities", response_model=MonthlyActivityResponse)
def create_monthly_activity(activity: MonthlyActivityCreate, db: Session = Depends(get_db)):
    """Create a new monthly activity"""
    db_activity = MonthlyActivity(**activity.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity
