import requests
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Project, Candidate, DailyLog, MonthlyKPI, Section, CandidateSection, Base, User
from database import DATABASE_URL
from datetime import datetime

REMOTE_API_BASE = "https://hse-backend.up.railway.app/api"
# Check if local DATABASE_URL needs fixing (postgres vs postgresql)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def import_data():
    print("🚀 Starting data import from Cloud (Railway) to Local...")
    
    # 1. Fetch Projects
    try:
        print("📥 Fetching projects...")
        resp = requests.get(f"{REMOTE_API_BASE}/projects")
        if resp.status_code != 200:
            # Try with trailing slash
            resp = requests.get(f"{REMOTE_API_BASE}/projects/")
        
        if resp.status_code != 200:
            print(f"❌ Failed to fetch projects: {resp.status_code}")
            return

        projects = resp.json()
        print(f"✅ Found {len(projects)} projects.")
    except Exception as e:
        print(f"❌ Error request: {e}")
        return

    for p_data in projects:
        # Check if exists
        existing = db.query(Project).filter(Project.name == p_data['name']).first()
        if existing:
            print(f"   ⚠️ Project '{p_data['name']}' already exists. Skipping.")
            local_project_id = existing.id
        else:
            print(f"   Creating project '{p_data['name']}'...")
            new_project = Project(
                name=p_data['name'],
                location=p_data.get('location'),
                company=p_data.get('company'),
                hse_lead_name=p_data.get('hse_lead_name') or p_data.get('hseLeadName'),
                hse_lead_photo=p_data.get('hse_lead_photo') or p_data.get('hseLeadPhoto'),
                manpower=p_data.get('manpower', 0),
                man_hours=p_data.get('man_hours', 0),
                new_inductions=p_data.get('new_inductions', 0),
                high_risk=p_data.get('high_risk', []) or [],
                delete_pin=p_data.get('delete_pin')
            )
            db.add(new_project)
            db.commit()
            db.refresh(new_project)
            local_project_id = new_project.id
        
        # 2. Fetch Candidates
        print(f"     📥 Fetching candidates for project {p_data['name']}...")
        c_resp = requests.get(f"{REMOTE_API_BASE}/candidates/project/{p_data['id']}")
        if c_resp.status_code == 200:
            candidates = c_resp.json()
            for c_data in candidates:
                # Check if candidate exists in this project
                c_exist = db.query(Candidate).filter(
                    Candidate.project_id == local_project_id, 
                    Candidate.name == c_data['name']
                ).first()
                
                if c_exist:
                    local_candidate_id = c_exist.id
                else:
                    new_candidate = Candidate(
                        project_id=local_project_id,
                        name=c_data['name'],
                        photo=c_data['photo'],
                        role=c_data['role'],
                        display_order=c_data.get('displayOrder', 0)
                    )
                    db.add(new_candidate)
                    db.commit()
                    db.refresh(new_candidate)
                    local_candidate_id = new_candidate.id
                
                # 3. Logs
                logs = c_data.get('dailyLogs', {})
                for date_str, l_data in logs.items():
                    # Check existing log
                    log_exist = db.query(DailyLog).filter(
                        DailyLog.candidate_id == local_candidate_id,
                        DailyLog.log_date == date_str
                    ).first()
                    
                    if not log_exist:
                        new_log = DailyLog(
                            candidate_id=local_candidate_id,
                            log_date=date_str,
                            time_in=l_data.get('timeIn'),
                            time_out=l_data.get('timeOut'),
                            task_briefing=l_data.get('taskBriefing', False),
                            tbt_conducted=l_data.get('tbtConducted', False),
                            violation_briefing=l_data.get('violationBriefing', False),
                            checklist_submitted=l_data.get('checklistSubmitted', False),
                            inductions_covered=l_data.get('inductionsCovered', False),
                            barcode_implemented=l_data.get('barcodeImplemented', False),
                            attendance_verified=l_data.get('attendanceVerified', False),
                            safety_observations_recorded=l_data.get('safetyObservationsRecorded', False),
                            sor_ncr_closed=l_data.get('sorNcrClosed', False),
                            mock_drill_participated=l_data.get('mockDrillParticipated', False),
                            campaign_participated=l_data.get('campaignParticipated', False),
                            monthly_inspections_completed=l_data.get('monthlyInspectionsCompleted', False),
                            near_miss_reported=l_data.get('nearMissReported', False),
                            weekly_training_briefed=l_data.get('weeklyTrainingBriefed', False),
                            daily_reports_followup=l_data.get('dailyReportsFollowup', False),
                            msra_communicated=l_data.get('msraCommunicated', False),
                            consultant_responses=l_data.get('consultantResponses', False),
                            weekly_tbt_full_participation=l_data.get('weeklyTbtFullParticipation', False),
                            welfare_facilities_monitored=l_data.get('welfareFacilitiesMonitored', False),
                            monday_ncr_shared=l_data.get('mondayNcrShared', False),
                            safety_walks_conducted=l_data.get('safetyWalksConducted', False),
                            training_sessions_conducted=l_data.get('trainingSessionsConducted', False),
                            barcode_system_100=l_data.get('barcodeSystem100', False),
                            task_briefings_participating=l_data.get('taskBriefingsParticipating', False),
                            comment=l_data.get('comment'),
                            description=l_data.get('description')
                        )
                        db.add(new_log)
                
                # 4. KPIs
                kpis = c_data.get('monthlyKPIs', {})
                for month_str, k_data in kpis.items():
                    # Check if month_str looks like a date
                    if not month_str.startswith('20'):
                        continue
                        
                    kpi_exist = db.query(MonthlyKPI).filter(
                        MonthlyKPI.candidate_id == local_candidate_id,
                        MonthlyKPI.month == month_str
                    ).first()

                    
                    if not kpi_exist:
                        new_kpi = MonthlyKPI(
                            candidate_id=local_candidate_id,
                            month=month_str,
                            observations_open=k_data.get('observationsOpen', 0),
                            observations_closed=k_data.get('observationsClosed', 0),
                            violations=k_data.get('violations', 0),
                            ncrs_open=k_data.get('ncrsOpen', 0),
                            ncrs_closed=k_data.get('ncrsClosed', 0),
                            weekly_reports_open=k_data.get('weeklyReportsOpen', 0),
                            weekly_reports_closed=k_data.get('weeklyReportsClosed', 0)
                        )
                        db.add(new_kpi)
                
                db.commit()

    print("✅ Build Completed successfully!")

if __name__ == "__main__":
    import_data()
