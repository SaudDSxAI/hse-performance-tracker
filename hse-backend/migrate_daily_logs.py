"""
Database Migration Script - Add 10 New Daily Log Fields
HSE Performance Tracker
"""

import psycopg2

# Railway PostgreSQL connection string
# REPLACE THIS WITH YOUR ACTUAL DATABASE URL
DATABASE_URL = "postgresql://postgres:ijzufiKzIPKYmzMbzewaNRzzHKBQhORc@centerbeam.proxy.rlwy.net:25154/railway"

def run_migration():
    print("🔄 Connecting to Railway PostgreSQL...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ Connected successfully!\n")
        
        # Add 10 new columns to daily_logs table
        print("🔧 Adding new fields to daily_logs table...")
        
        new_fields = [
            ("daily_reports_followup", "Daily reports follow-up & coordination"),
            ("msra_communicated", "MSRA communicated to all key personnel"),
            ("consultant_responses", "Immediate responses to consultant"),
            ("weekly_tbt_full_participation", "Weekly mass TBT with full participation"),
            ("welfare_facilities_monitored", "Workforce welfare facilities monitored"),
            ("monday_ncr_shared", "Monday shared pending NCRs/SORs"),
            ("safety_walks_conducted", "Two site safety walks daily (7AM & 2PM)"),
            ("training_sessions_conducted", "Minimum 2 HSE training sessions per month"),
            ("barcode_system_100", "Bar code system 100% for Plant/Equipment/PTW"),
            ("task_briefings_participating", "Engineers participating task briefings & verifying")
        ]
        
        for field_name, description in new_fields:
            try:
                cursor.execute(f"""
                    ALTER TABLE daily_logs 
                    ADD COLUMN IF NOT EXISTS {field_name} BOOLEAN;
                """)
                print(f"  ✅ {field_name} - {description}")
            except Exception as e:
                print(f"  ⚠️ {field_name}: {e}")
        
        print("\n📋 Verifying daily_logs columns...")
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'daily_logs' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        print(f"\nTotal columns in daily_logs: {len(columns)}")
        print("\nNew fields added:")
        for col in columns:
            if col[0] in [f[0] for f in new_fields]:
                print(f"  - {col[0]} ({col[1]})")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("🎯 10 new daily log fields added to database")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    run_migration() 