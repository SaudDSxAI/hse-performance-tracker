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
        
        # Delete existing admin user if exists, then create new one
        # Password hash for "admin123" generated with bcrypt
        print("🔧 Creating default admin user...")
        try:
            # First delete if exists
            cursor.execute("DELETE FROM users WHERE username = 'admin';")
            
            # Insert with proper bcrypt hash for "admin123"
            # This hash was generated with: passlib.hash.bcrypt.hash("admin123")
            cursor.execute("""
                INSERT INTO users (username, password_hash, is_admin)
                VALUES ('admin', '$2b$12$8kX5xYGP9m0KLQ1vwJQPXuHRVQkN3R6hGhKj6sL2BvRqXF9.mJYCi', TRUE);
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
        
        # Show users
        cursor.execute("SELECT id, username, is_admin FROM users;")
        users = cursor.fetchall()
        print("\nUsers in database:")
        for u in users:
            print(f"  ID: {u[0]}, Username: {u[1]}, Admin: {u[2]}")
        
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