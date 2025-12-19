"""
Create Admin User Script
Run this AFTER deploying the backend with auth.py
"""

import psycopg2
import os

# Try to import from deployed backend
try:
    from auth import get_password_hash
except ImportError:
    # Fallback - install and use passlib directly
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    def get_password_hash(password):
        return pwd_context.hash(password)

# Railway PostgreSQL connection string
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:ijzufiKzIPKYmzMbzewaNRzzHKBQhORc@centerbeam.proxy.rlwy.net:25154/railway")

def create_admin():
    print("🔄 Connecting to database...")
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("✅ Connected!\n")
    
    # Create users table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE
        );
    """)
    
    # Add delete_pin to projects if not exists
    cursor.execute("""
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS delete_pin VARCHAR(50);
    """)
    
    # Generate password hash
    password = "admin123"
    password_hash = get_password_hash(password)
    
    print(f"Generated hash: {password_hash[:20]}...")
    
    # Delete existing admin and create new one
    cursor.execute("DELETE FROM users WHERE username = 'admin';")
    cursor.execute(
        "INSERT INTO users (username, password_hash, is_admin) VALUES (%s, %s, %s);",
        ('admin', password_hash, True)
    )
    
    print("\n✅ Admin user created!")
    print("   Username: admin")
    print("   Password: admin123")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    create_admin()