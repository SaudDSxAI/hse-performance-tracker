"""
Add display_order column to candidates table
"""

import psycopg2

DATABASE_URL = "postgresql://postgres:ijzufiKzIPKYmzMbzewaNRzzHKBQhORc@centerbeam.proxy.rlwy.net:25154/railway"

def run_migration():
    print("🔄 Connecting to database...")
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("✅ Connected!\n")
    
    # Add display_order column
    print("🔧 Adding display_order column to candidates...")
    try:
        cursor.execute("""
            ALTER TABLE candidates ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
        """)
        print("  ✅ display_order column added")
    except Exception as e:
        print(f"  ⚠️ {e}")
    
    # Set initial order based on existing IDs
    print("🔧 Setting initial order values...")
    cursor.execute("""
        UPDATE candidates SET display_order = id WHERE display_order = 0 OR display_order IS NULL;
    """)
    print("  ✅ Initial order set")
    
    # Verify
    print("\n📋 Candidates with display_order:")
    cursor.execute("SELECT id, name, display_order FROM candidates ORDER BY display_order;")
    for row in cursor.fetchall():
        print(f"   - ID: {row[0]}, Name: {row[1]}, Order: {row[2]}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Migration completed!")

if __name__ == "__main__":
    run_migration()