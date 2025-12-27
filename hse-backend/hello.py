"""
Database Verification Script - HSE Performance Tracker
This script checks if your data exists and diagnoses any issues
"""

import psycopg2
from psycopg2 import sql

# Railway PostgreSQL connection string
# REPLACE THIS WITH YOUR ACTUAL DATABASE URL
DATABASE_URL = "postgresql://postgres:ijzufiKzIPKYmzMbzewaNRzzHKBQhORc@centerbeam.proxy.rlwy.net:25154/railway"

def verify_database():
    print("🔍 HSE Performance Tracker - Database Verification")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("✅ Connected to database successfully!\n")
        
        # 1. Check all tables
        print("📋 CHECKING TABLES:")
        print("-" * 60)
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  ✓ {table[0]}")
        print()
        
        # 2. Check Projects
        print("📊 PROJECTS DATA:")
        print("-" * 60)
        cursor.execute("SELECT COUNT(*) FROM projects;")
        project_count = cursor.fetchone()[0]
        print(f"Total Projects: {project_count}")
        
        if project_count > 0:
            cursor.execute("SELECT id, name, location, company FROM projects LIMIT 5;")
            projects = cursor.fetchall()
            for p in projects:
                print(f"  • ID: {p[0]} | Name: {p[1]} | Location: {p[2]} | Company: {p[3]}")
        print()
        
        # 3. Check Candidates
        print("👥 CANDIDATES DATA:")
        print("-" * 60)
        cursor.execute("SELECT COUNT(*) FROM candidates;")
        candidate_count = cursor.fetchone()[0]
        print(f"Total Candidates: {candidate_count}")
        
        if candidate_count > 0:
            cursor.execute("""
                SELECT c.id, c.name, c.role, p.name as project_name 
                FROM candidates c
                LEFT JOIN projects p ON c.project_id = p.id
                LIMIT 10;
            """)
            candidates = cursor.fetchall()
            for c in candidates:
                print(f"  • ID: {c[0]} | Name: {c[1]} | Role: {c[2]} | Project: {c[3]}")
        print()
        
        # 4. Check Candidate columns
        print("🔧 CANDIDATES TABLE STRUCTURE:")
        print("-" * 60)
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'candidates'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        print(f"Candidates table has {len(columns)} columns:")
        for col in columns:
            print(f"  • {col[0]} ({col[1]})")
        print()
        
        # 5. Check Daily Logs
        print("📅 DAILY LOGS DATA:")
        print("-" * 60)
        cursor.execute("SELECT COUNT(*) FROM daily_logs;")
        log_count = cursor.fetchone()[0]
        print(f"Total Daily Logs: {log_count}")
        
        if log_count > 0:
            cursor.execute("""
                SELECT dl.id, c.name, dl.log_date, dl.time_in, dl.time_out
                FROM daily_logs dl
                LEFT JOIN candidates c ON dl.candidate_id = c.id
                ORDER BY dl.log_date DESC
                LIMIT 5;
            """)
            logs = cursor.fetchall()
            print("Recent logs:")
            for log in logs:
                print(f"  • Candidate: {log[1]} | Date: {log[2]} | In: {log[3]} | Out: {log[4]}")
        print()
        
        # 6. Check Daily Logs columns
        print("🔧 DAILY_LOGS TABLE STRUCTURE:")
        print("-" * 60)
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'daily_logs'
            ORDER BY ordinal_position;
        """)
        log_columns = cursor.fetchall()
        print(f"Daily_logs table has {len(log_columns)} columns:")
        
        # Check for new fields
        new_fields = [
            'daily_reports_followup', 'msra_communicated', 'consultant_responses',
            'weekly_tbt_full_participation', 'welfare_facilities_monitored',
            'monday_ncr_shared', 'safety_walks_conducted', 'training_sessions_conducted',
            'barcode_system_100', 'task_briefings_participating'
        ]
        
        existing_cols = [col[0] for col in log_columns]
        for field in new_fields:
            status = "✅" if field in existing_cols else "❌"
            print(f"  {status} {field}")
        print()
        
        # 7. Check Sections (if exists)
        if 'sections' in [t[0] for t in tables]:
            print("📁 SECTIONS DATA:")
            print("-" * 60)
            cursor.execute("SELECT COUNT(*) FROM sections;")
            section_count = cursor.fetchone()[0]
            print(f"Total Sections: {section_count}")
            
            if section_count > 0:
                cursor.execute("""
                    SELECT s.id, s.name, p.name as project_name
                    FROM sections s
                    LEFT JOIN projects p ON s.project_id = p.id
                    LIMIT 5;
                """)
                sections = cursor.fetchall()
                for s in sections:
                    print(f"  • ID: {s[0]} | Name: {s[1]} | Project: {s[2]}")
            print()
        else:
            print("⚠️  SECTIONS TABLE NOT FOUND")
            print("   Run migrate_sections.py to create it\n")
        
        # 8. Check Monthly KPIs
        print("📊 MONTHLY KPIs DATA:")
        print("-" * 60)
        cursor.execute("SELECT COUNT(*) FROM monthly_kpis;")
        kpi_count = cursor.fetchone()[0]
        print(f"Total Monthly KPIs: {kpi_count}")
        print()
        
        # 9. Summary
        print("=" * 60)
        print("📈 SUMMARY:")
        print("=" * 60)
        print(f"✓ Projects: {project_count}")
        print(f"✓ Candidates: {candidate_count}")
        print(f"✓ Daily Logs: {log_count}")
        print(f"✓ Monthly KPIs: {kpi_count}")
        
        # Check if migrations are needed
        print("\n🔧 MIGRATION STATUS:")
        missing_new_fields = [f for f in new_fields if f not in existing_cols]
        if missing_new_fields:
            print(f"❌ Missing {len(missing_new_fields)} new daily log fields")
            print("   → Run: python migrate_new_daily_fields.py")
        else:
            print("✅ All new daily log fields present")
        
        if 'sections' not in [t[0] for t in tables]:
            print("❌ Sections tables not created")
            print("   → Run: python migrate_sections.py")
        else:
            print("✅ Sections tables exist")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        if project_count == 0:
            print("⚠️  WARNING: No projects found in database!")
            print("   Your data might have been deleted or you're connected to wrong DB")
        elif candidate_count == 0:
            print("⚠️  WARNING: No candidates found!")
            print("   Projects exist but no candidates added yet")
        else:
            print("✅ Database looks healthy!")
            print("   All your data is present and accessible")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nPossible issues:")
        print("  1. Wrong DATABASE_URL")
        print("  2. Database connection failed")
        print("  3. Tables don't exist")
        raise

if __name__ == "__main__":
    verify_database()