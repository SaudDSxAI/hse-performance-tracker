from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, time
from database import get_db
from models import DailyLog, MonthlyKPI
from schemas import DailyLogCreate, DailyLogResponse, MonthlyKPICreate, MonthlyKPIResponse

router = APIRouter(tags=["Daily Logs & Monthly KPIs"])

# ==================== DAILY LOGS ====================

@router.post("/api/daily-logs", response_model=DailyLogResponse)
def create_or_update_daily_log(log_data: DailyLogCreate, db: Session = Depends(get_db)):
    """Create or update a daily log for a candidate on a specific date"""
    # Check if log already exists for this candidate and date
    existing_log = db.query(DailyLog).filter(
        DailyLog.candidate_id == log_data.candidate_id,
        DailyLog.log_date == log_data.log_date
    ).first()
    
    if existing_log:
        # Update existing log
        for key, value in log_data.model_dump(exclude_unset=True).items():
            if key != 'candidate_id':  # Don't update candidate_id
                setattr(existing_log, key, value)
        db.commit()
        db.refresh(existing_log)
        return existing_log
    else:
        # Create new log
        db_log = DailyLog(**log_data.model_dump())
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

@router.get("/api/daily-logs/candidate/{candidate_id}", response_model=List[DailyLogResponse])
def get_daily_logs_by_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get all daily logs for a specific candidate"""
    logs = db.query(DailyLog).filter(
        DailyLog.candidate_id == candidate_id
    ).order_by(DailyLog.log_date.desc()).all()
    return logs

@router.get("/api/daily-logs/{log_id}", response_model=DailyLogResponse)
def get_daily_log(log_id: int, db: Session = Depends(get_db)):
    """Get a specific daily log by ID"""
    log = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    return log

@router.put("/api/daily-logs/{log_id}", response_model=DailyLogResponse)
def update_daily_log(log_id: int, log_data: DailyLogCreate, db: Session = Depends(get_db)):
    """Update an existing daily log"""
    db_log = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    for key, value in log_data.model_dump(exclude_unset=True).items():
        setattr(db_log, key, value)
    
    db.commit()
    db.refresh(db_log)
    return db_log

@router.delete("/api/daily-logs/{log_id}")
def delete_daily_log(log_id: int, db: Session = Depends(get_db)):
    """Delete a daily log"""
    db_log = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    db.delete(db_log)
    db.commit()
    return {"message": "Daily log deleted successfully"}

# ==================== MONTHLY KPIs ====================

@router.post("/api/monthly-kpis", response_model=MonthlyKPIResponse)
def create_or_update_monthly_kpi(kpi_data: MonthlyKPICreate, db: Session = Depends(get_db)):
    """Create or update monthly KPI for a candidate"""
    # Check if KPI already exists for this candidate and month
    existing_kpi = db.query(MonthlyKPI).filter(
        MonthlyKPI.candidate_id == kpi_data.candidate_id,
        MonthlyKPI.month == kpi_data.month
    ).first()
    
    if existing_kpi:
        # Update existing KPI
        for key, value in kpi_data.model_dump(exclude_unset=True).items():
            if key != 'candidate_id':  # Don't update candidate_id
                setattr(existing_kpi, key, value)
        db.commit()
        db.refresh(existing_kpi)
        return existing_kpi
    else:
        # Create new KPI
        db_kpi = MonthlyKPI(**kpi_data.model_dump())
        db.add(db_kpi)
        db.commit()
        db.refresh(db_kpi)
        return db_kpi

@router.get("/api/monthly-kpis/candidate/{candidate_id}", response_model=List[MonthlyKPIResponse])
def get_monthly_kpis_by_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get all monthly KPIs for a specific candidate"""
    kpis = db.query(MonthlyKPI).filter(
        MonthlyKPI.candidate_id == candidate_id
    ).order_by(MonthlyKPI.month.desc()).all()
    return kpis

@router.get("/api/monthly-kpis/{kpi_id}", response_model=MonthlyKPIResponse)
def get_monthly_kpi(kpi_id: int, db: Session = Depends(get_db)):
    """Get a specific monthly KPI by ID"""
    kpi = db.query(MonthlyKPI).filter(MonthlyKPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="Monthly KPI not found")
    return kpi

@router.put("/api/monthly-kpis/{kpi_id}", response_model=MonthlyKPIResponse)
def update_monthly_kpi(kpi_id: int, kpi_data: MonthlyKPICreate, db: Session = Depends(get_db)):
    """Update an existing monthly KPI"""
    db_kpi = db.query(MonthlyKPI).filter(MonthlyKPI.id == kpi_id).first()
    if not db_kpi:
        raise HTTPException(status_code=404, detail="Monthly KPI not found")
    
    for key, value in kpi_data.model_dump(exclude_unset=True).items():
        setattr(db_kpi, key, value)
    
    db.commit()
    db.refresh(db_kpi)
    return db_kpi

@router.delete("/api/monthly-kpis/{kpi_id}")
def delete_monthly_kpi(kpi_id: int, db: Session = Depends(get_db)):
    """Delete a monthly KPI"""
    db_kpi = db.query(MonthlyKPI).filter(MonthlyKPI.id == kpi_id).first()
    if not db_kpi:
        raise HTTPException(status_code=404, detail="Monthly KPI not found")
    
    db.delete(db_kpi)
    db.commit()
    return {"message": "Monthly KPI deleted successfully"}