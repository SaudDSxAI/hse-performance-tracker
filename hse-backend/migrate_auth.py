"""
Database Migration Script - Add Authentication
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
        
        # Create users table
        print("🔧 Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE
            );
        """)
        print("  ✅ Users table created")
        
        # Add delete_pin to projects
        print("🔧 Adding delete_pin to projects table...")
        try:
            cursor.execute("""
                ALTER TABLE projects ADD COLUMN IF NOT EXISTS delete_pin VARCHAR(50);
            """)
            print("  ✅ delete_pin column added")
        except Exception as e:
            print(f"  ⚠️ delete_pin: {e}")
        
        # Create default admin user (password: admin123)
        # Hash generated with bcrypt for "admin123"
        print("🔧 Creating default admin user...")
        try:
            cursor.execute("""
                INSERT INTO users (username, password_hash, is_admin)
                VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.i6kqVqP9HJ3kGu', TRUE)
                ON CONFLICT (username) DO NOTHING;
            """)
            print("  ✅ Default admin user created")
            print("     Username: admin")
            print("     Password: admin123")
        except Exception as e:
            print(f"  ⚠️ Admin user: {e}")
        
        print("\n📋 Verifying tables...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print("Tables:", [t[0] for t in tables])
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("\n🔐 Default Login Credentials:")
        print("   Username: admin")
        print("   Password: admin123")
        print("\n⚠️  Please change the password after first login!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    run_migration()