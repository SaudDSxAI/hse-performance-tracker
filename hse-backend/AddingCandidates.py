from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Candidate, DailyLog, MonthlyKPI, CandidateSection, Project, User
from schemas import CandidateCreate, CandidateUpdate, CandidateResponse, CandidateReorder
from auth import get_current_active_user

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

def verify_project_access(project_id: int, user: User, db: Session):
    """Helper to ensure user owns project and is assigned if not admin"""
    query = db.query(Project).filter(
        Project.id == project_id, 
        Project.organization_id == user.organization_id
    )
    
    # Non-admins must be assigned to the project
    if user.role != "admin":
        query = query.filter(Project.assigned_leads.any(User.id == user.id))
        
    project = query.first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    return project

@router.get("/project/{project_id}")
def get_candidates_by_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all candidates for a specific project with their daily logs and KPIs"""
    verify_project_access(project_id, current_user, db)

    candidates = db.query(Candidate).filter(
        Candidate.project_id == project_id
    ).order_by(Candidate.display_order).all()
    
    # Transform each candidate to include daily logs and KPIs
    result = []
    for candidate in candidates:
        # Get section assignments for this candidate
        section_assignments = db.query(CandidateSection).filter(
            CandidateSection.candidate_id == candidate.id
        ).all()
        section_ids = [cs.section_id for cs in section_assignments]
        
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
            "section_ids": section_ids,  # ✅ ADDED THIS
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
                str(kpi.month): {
                    "observationsOpen": kpi.observations_open,
                    "observationsClosed": kpi.observations_closed,
                    "violations": kpi.violations,
                    "ncrsOpen": kpi.ncrs_open,
                    "ncrsClosed": kpi.ncrs_closed,
                    "weeklyReportsOpen": kpi.weekly_reports_open,
                    "weeklyReportsClosed": kpi.weekly_reports_closed
                }
                for kpi in monthly_kpis
            }
        }
        
        result.append(candidate_data)
    
    return result

@router.get("/{candidate_id}")
def get_candidate(
    candidate_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific candidate by ID with daily logs and KPIs"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Security: Verify project ownership
    verify_project_access(candidate.project_id, current_user, db)
    
    # Get section assignments for this candidate
    section_assignments = db.query(CandidateSection).filter(
        CandidateSection.candidate_id == candidate.id
    ).all()
    section_ids = [cs.section_id for cs in section_assignments]
    
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
        "section_ids": section_ids,  # ✅ ADDED THIS
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
            str(kpi.month): {
                "observationsOpen": kpi.observations_open,
                "observationsClosed": kpi.observations_closed,
                "violations": kpi.violations,
                "ncrsOpen": kpi.ncrs_open,
                "ncrsClosed": kpi.ncrs_closed,
                "weeklyReportsOpen": kpi.weekly_reports_open,
                "weeklyReportsClosed": kpi.weekly_reports_closed
            }
            for kpi in monthly_kpis
        }
    }
    
    return candidate_data

@router.post("", response_model=CandidateResponse)
def create_candidate(
    candidate: CandidateCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new candidate"""
    # Security: Verify project ownership
    verify_project_access(candidate.project_id, current_user, db)

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
def update_candidate(
    candidate_id: int, 
    candidate: CandidateUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing candidate"""
    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Security: Verify project ownership
    verify_project_access(db_candidate.project_id, current_user, db)

    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot update candidates")

    for key, value in candidate.model_dump(exclude_unset=True).items():
        setattr(db_candidate, key, value)
    
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

@router.delete("/{candidate_id}")
def delete_candidate(
    candidate_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a candidate (Admins Only)"""
    # Phase 5: RBAC - Only admins can delete
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete candidates")

    db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Security: Verify project ownership
    verify_project_access(db_candidate.project_id, current_user, db)

    db.delete(db_candidate)
    db.commit()
    return {"message": "Candidate deleted successfully"}

@router.put("/project/{project_id}/reorder")
def reorder_candidates(
    project_id: int, 
    reorder: CandidateReorder, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reorder candidates for a project"""
    # Security: Verify project ownership
    verify_project_access(project_id, current_user, db)

    for index, candidate_id in enumerate(reorder.candidate_ids):
        candidate = db.query(Candidate).filter(
            Candidate.id == candidate_id,
            Candidate.project_id == project_id
        ).first()
        if candidate:
            candidate.display_order = index
    
    db.commit()
    return {"message": "Candidates reordered successfully"}