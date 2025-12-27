from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Candidate, DailyLog, MonthlyKPI
from schemas import CandidateCreate, CandidateUpdate, CandidateResponse, CandidateReorder

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("/project/{project_id}")
def get_candidates_by_project(project_id: int, db: Session = Depends(get_db)):
    """Get all candidates for a specific project with their daily logs and KPIs"""
    candidates = db.query(Candidate).filter(
        Candidate.project_id == project_id
    ).order_by(Candidate.display_order).all()
    
    # Transform each candidate to include daily logs and KPIs
    result = []
    for candidate in candidates:
        # Get daily logs
        daily_logs = db.query(DailyLog).filter(
            DailyLog.candidate_id == candidate.id
        ).all()
        
        # Get monthly KPIs
        monthly_kpis = db.query(MonthlyKPI).filter(
            MonthlyKPI.candidate_id == candidate.id
        ).order_by(MonthlyKPI.month.desc()).all()
        
        # Transform to frontend format
        candidate_data = {
            "id": candidate.id,
            "name": candidate.name,
            "photo": candidate.photo,
            "role": candidate.role,
            "displayOrder": candidate.display_order,
            "dailyLogs": {
                str(log.log_date): {
                    "timeIn": str(log.time_in) if log.time_in else None,
                    "timeOut": str(log.time_out) if log.time_out else None,
                    "taskBriefing": log.task_briefing,
                    "tbtConducted": log.tbt_conducted,
                    "violationBriefing": log.violation_briefing,
                    "checklistSubmitted": log.checklist_submitted,
                    "inductionsCovered": log.inductions_covered,
                    "barcodeImplemented": log.barcode_implemented,
                    "attendanceVerified": log.attendance_verified,
                    "safetyObservationsRecorded": log.safety_observations_recorded,
                    "sorNcrClosed": log.sor_ncr_closed,
                    "mockDrillParticipated": log.mock_drill_participated,
                    "campaignParticipated": log.campaign_participated,
                    "monthlyInspectionsCompleted": log.monthly_inspections_completed,
                    "nearMissReported": log.near_miss_reported,
                    "weeklyTrainingBriefed": log.weekly_training_briefed,
                    "dailyReportsFollowup": log.daily_reports_followup,
                    "msraCommunicated": log.msra_communicated,
                    "consultantResponses": log.consultant_responses,
                    "weeklyTbtFullParticipation": log.weekly_tbt_full_participation,
                    "welfareFacilitiesMonitored": log.welfare_facilities_monitored,
                    "mondayNcrShared": log.monday_ncr_shared,
                    "safetyWalksConducted": log.safety_walks_conducted,
                    "trainingSessionsConducted": log.training_sessions_conducted,
                    "barcodeSystem100": log.barcode_system_100,
                    "taskBriefingsParticipating": log.task_briefings_participating,
                    "comment": log.comment,
                    "description": log.description
                }
                for log in daily_logs
            },
            "monthlyKPIs": {
                "observationsOpen": monthly_kpis[0].observations_open if monthly_kpis else 0,
                "observationsClosed": monthly_kpis[0].observations_closed if monthly_kpis else 0,
                "violations": monthly_kpis[0].violations if monthly_kpis else 0,
                "ncrsOpen": monthly_kpis[0].ncrs_open if monthly_kpis else 0,
                "ncrsClosed": monthly_kpis[0].ncrs_closed if monthly_kpis else 0,
                "weeklyReportsOpen": monthly_kpis[0].weekly_reports_open if monthly_kpis else 0,
                "weeklyReportsClosed": monthly_kpis[0].weekly_reports_closed if monthly_kpis else 0
            }
        }
        
        result.append(candidate_data)
    
    return result

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get a specific candidate by ID"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@router.post("/", response_model=CandidateResponse)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    """Create a new candidate"""
    # Get max display_order for this project
    max_order = db.query(Candidate).filter(
        Candidate.project_id == candidate.project_id
    ).count()
    
    # Create candidate data without display_order from input
    candidate_data = candidate.model_dump()
    candidate_data['display_order'] = max_order  # Override with calculated order
    
    db_candidate = Candidate(**candidate_data)
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: int, candidate: CandidateUpdate, db: Session = Depends(get_db)):
    """Update an existing candidate"""
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    for key, value in candidate.model_dump(exclude_unset=True).items():
        setattr(db_candidate, key, value)
    
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate"""
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    db.delete(db_candidate)
    db.commit()
    return {"message": "Candidate deleted successfully"}

@router.put("/project/{project_id}/reorder")
def reorder_candidates(project_id: int, reorder: CandidateReorder, db: Session = Depends(get_db)):
    """Reorder candidates for a project"""
    for index, candidate_id in enumerate(reorder.candidate_ids):
        candidate = db.query(Candidate).filter(
            Candidate.id == candidate_id,
            Candidate.project_id == project_id
        ).first()
        if candidate:
            candidate.display_order = index
    
    db.commit()
    return {"message": "Candidates reordered successfully"}