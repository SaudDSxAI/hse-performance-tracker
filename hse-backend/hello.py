"""
Check and add delete_pin column to projects table
"""

import psycopg2

DATABASE_URL = "postgresql://postgres:ijzufiKzIPKYmzMbzewaNRzzHKBQhORc@centerbeam.proxy.rlwy.net:25154/railway"

def check_and_add_column():
    print("🔄 Connecting to database...")
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("✅ Connected!\n")
    
    # Check if column exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'delete_pin';
    """)
    
    result = cursor.fetchone()
    
    if result:
        print("✅ delete_pin column EXISTS in projects table")
    else:
        print("❌ delete_pin column DOES NOT exist")
        print("🔧 Adding delete_pin column...")
        cursor.execute("ALTER TABLE projects ADD COLUMN delete_pin VARCHAR(50);")
        print("✅ Column added!")
    
    # Show all columns in projects table
    print("\n📋 Columns in projects table:")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'projects'
        ORDER BY ordinal_position;
    """)
    
    for row in cursor.fetchall():
        print(f"   - {row[0]} ({row[1]})")
    
    # Show existing projects with delete_pin
    print("\n📋 Projects and their delete_pin values:")
    cursor.execute("SELECT id, name, delete_pin FROM projects;")
    for row in cursor.fetchall():
        print(f"   - ID: {row[0]}, Name: {row[1]}, PIN: {row[2]}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Done!")

if __name__ == "__main__":
    check_and_add_column()