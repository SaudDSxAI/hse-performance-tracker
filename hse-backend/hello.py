"""
Database Migration Script - Add New Daily Log Fields
HSE Performance Tracker
"""

import psycopg2

# Railway PostgreSQL connection string
DATABASE_URL = "postgresql://postgres:ijzufiKzIPKYmzMbzewaNRzzHKBQhORc@centerbeam.proxy.rlwy.net:25154/railway"

def run_migration():
    print("🔄 Connecting to Railway PostgreSQL...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ Connected successfully!\n")
        
        # New columns to add
        new_columns = [
            ("inductions_covered", "BOOLEAN"),
            ("barcode_implemented", "BOOLEAN"),
            ("attendance_verified", "BOOLEAN"),
            ("safety_observations_recorded", "BOOLEAN"),
            ("sor_ncr_closed", "BOOLEAN"),
            ("mock_drill_participated", "BOOLEAN"),
            ("campaign_participated", "BOOLEAN"),
            ("monthly_inspections_completed", "BOOLEAN"),
            ("near_miss_reported", "BOOLEAN"),
            ("weekly_training_briefed", "BOOLEAN"),
        ]
        
        print("🔧 Adding new columns to daily_logs table...\n")
        
        for col_name, col_type in new_columns:
            try:
                sql = f"ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                cursor.execute(sql)
                print(f"  ✅ Added: {col_name}")
            except Exception as e:
                print(f"  ⚠️ {col_name}: {e}")
        
        print("\n📋 Verifying table structure...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'daily_logs'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\n" + "="*60)
        print("DAILY_LOGS TABLE STRUCTURE")
        print("="*60)
        print(f"{'Column':<35} {'Type':<15} {'Nullable'}")
        print("-"*60)
        for col in columns:
            print(f"{col[0]:<35} {col[1]:<15} {col[2]}")
        print("="*60)
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("🚀 New daily log fields are ready!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    run_migration()