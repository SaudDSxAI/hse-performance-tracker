from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Project, Candidate, DailyLog, MonthlyKPI, Section, User
from auth import get_current_active_user
import json
from datetime import date, time

router = APIRouter(prefix="/api/export", tags=["Data Export"])

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (date, time)):
        return obj.isoformat()
    raise TypeError ("Type %s not serializable" % type(obj))

@router.get("/full-backup")
def export_all_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Export complete organization data as JSON"""
    
    # 1. Fetch Projecs
    projects = db.query(Project).filter(Project.organization_id == current_user.organization_id).all()
    
    export_data = {
        "organization": current_user.organization.name,
        "exported_at": date.today().isoformat(),
        "exported_by": current_user.username,
        "projects": []
    }
    
    for proj in projects:
        proj_data = {
            "id": proj.id,
            "name": proj.name,
            "location": proj.location,
            "company": proj.company,
            "candidates": []
        }
        
        # 2. Fetch Candidates
        candidates = db.query(Candidate).filter(Candidate.project_id == proj.id).all()
        for cand in candidates:
            cand_data = {
                "id": cand.id,
                "name": cand.name,
                "role": cand.role,
                "daily_logs": [],
                "monthly_kpis": []
            }
            
            # 3. Logs
            logs = db.query(DailyLog).filter(DailyLog.candidate_id == cand.id).all()
            for log in logs:
                log_dict = {c.name: getattr(log, c.name) for c in log.__table__.columns}
                # Serialize dates/times
                for k, v in log_dict.items():
                    if isinstance(v, (date, time)):
                        log_dict[k] = v.isoformat()
                cand_data["daily_logs"].append(log_dict)
            
            # 4. KPIs
            kpis = db.query(MonthlyKPI).filter(MonthlyKPI.candidate_id == cand.id).all()
            for kpi in kpis:
                kpi_dict = {c.name: getattr(kpi, c.name) for c in kpi.__table__.columns}
                for k, v in kpi_dict.items():
                    if isinstance(v, (date, time)):
                        kpi_dict[k] = v.isoformat()
                cand_data["monthly_kpis"].append(kpi_dict)
                
            proj_data["candidates"].append(cand_data)
        
        export_data["projects"].append(proj_data)
        
    return export_data
