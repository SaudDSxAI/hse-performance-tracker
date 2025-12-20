"""
Add comment and description columns to daily_logs table
"""

import psycopg2

DATABASE_URL = "postgresql://postgres:ijzufiKzIPKYmzMbzewaNRzzHKBQhORc@centerbeam.proxy.rlwy.net:25154/railway"

def run_migration():
    print("🔄 Connecting to database...")
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("✅ Connected!\n")
    
    # Add comment column
    print("🔧 Adding comment column to daily_logs...")
    try:
        cursor.execute("""
            ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS comment VARCHAR(255);
        """)
        print("  ✅ comment column added")
    except Exception as e:
        print(f"  ⚠️ {e}")
    
    # Add description column
    print("🔧 Adding description column to daily_logs...")
    try:
        cursor.execute("""
            ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS description TEXT;
        """)
        print("  ✅ description column added")
    except Exception as e:
        print(f"  ⚠️ {e}")
    
    # Verify columns
    print("\n📋 Columns in daily_logs table:")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'daily_logs'
        ORDER BY ordinal_position;
    """)
    for row in cursor.fetchall():
        print(f"   - {row[0]} ({row[1]})")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Migration completed!")

if __name__ == "__main__":
    run_migration()