"""
Database Migration Script - Add Sections Feature
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
        
        # Create sections table
        print("🔧 Creating sections table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                display_order INTEGER DEFAULT 0
            );
        """)
        print("  ✅ Sections table created")
        
        # Create candidate_sections junction table
        print("🔧 Creating candidate_sections junction table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidate_sections (
                id SERIAL PRIMARY KEY,
                candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
                section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
                UNIQUE(candidate_id, section_id)
            );
        """)
        print("  ✅ Candidate_sections junction table created")
        
        # Create index for better performance
        print("🔧 Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sections_project_id 
            ON sections(project_id);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_candidate_sections_candidate_id 
            ON candidate_sections(candidate_id);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_candidate_sections_section_id 
            ON candidate_sections(section_id);
        """)
        print("  ✅ Indexes created")
        
        print("\n📋 Verifying tables...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('sections', 'candidate_sections')
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print("New tables created:", [t[0] for t in tables])
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("🎯 Sections feature is now ready to use")
        print("\nℹ️  Features added:")
        print("  - Create custom sections per project")
        print("  - Assign candidates to multiple sections")
        print("  - Group and organize candidates by sections")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    run_migration()