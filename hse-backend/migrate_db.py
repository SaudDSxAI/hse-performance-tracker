from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def run_step(sql, description):
    with engine.connect() as conn:
        try:
            print(f"Running: {description}...")
            conn.execute(text(sql))
            conn.commit()
            print(f"✅ Success.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"ℹ️ Already exists.")
            else:
                print(f"❌ Error: {e}")

def migrate():
    print("Starting migration...")
    
    # User columns
    run_step("ALTER TABLE users ADD COLUMN email VARCHAR;", "Add email to users")
    run_step("ALTER TABLE users ADD COLUMN full_name VARCHAR;", "Add full_name to users")
    
    # Project columns
    run_step("ALTER TABLE projects ADD COLUMN delete_pin VARCHAR;", "Add delete_pin to projects")
    run_step("ALTER TABLE projects ADD COLUMN high_risk JSONB DEFAULT '[]'::jsonb;", "Add high_risk to projects")

    # Candidate columns
    run_step("ALTER TABLE candidates ADD COLUMN display_order INTEGER DEFAULT 0;", "Add display_order to candidates")
    
    # Daily Log columns
    new_log_cols = [
        "daily_reports_followup",
        "msra_communicated",
        "consultant_responses",
        "weekly_tbt_full_participation",
        "welfare_facilities_monitored",
        "monday_ncr_shared",
        "safety_walks_conducted",
        "training_sessions_conducted",
        "barcode_system_100",
        "task_briefings_participating",
        "inductions_covered", 
        "barcode_implemented",
        "attendance_verified",
        "safety_observations_recorded",
        "sor_ncr_closed",
        "mock_drill_participated",
        "campaign_participated",
        "monthly_inspections_completed",
        "near_miss_reported",
        "weekly_training_briefed",
        "task_briefing",
        "tbt_conducted",
        "violation_briefing",
        "checklist_submitted"
    ]
    
    for col in new_log_cols:
        run_step(f"ALTER TABLE daily_logs ADD COLUMN {col} BOOLEAN DEFAULT FALSE;", f"Add {col} to daily_logs")

    run_step("ALTER TABLE daily_logs ADD COLUMN comment VARCHAR(255);", "Add comment to daily_logs")
    run_step("ALTER TABLE daily_logs ADD COLUMN description VARCHAR;", "Add description to daily_logs")

    
    
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
