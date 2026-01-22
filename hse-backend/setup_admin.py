from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def setup_admin():
    password_hash = get_password_hash("admin123")
    with engine.connect() as conn:
        # Delete if exists to reset
        conn.execute(text("DELETE FROM users WHERE username = 'admin';"))
        
        # Insert admin
        conn.execute(text("""
            INSERT INTO users (username, password_hash, is_admin, full_name, email) 
            VALUES (:username, :password_hash, :is_admin, :full_name, :email);
        """), {
            "username": "admin",
            "password_hash": password_hash,
            "is_admin": True,
            "full_name": "System Administrator",
            "email": "admin@example.com"
        })
        conn.commit()
        print("✅ Admin account 'admin' created with password 'admin123'")

if __name__ == "__main__":
    setup_admin()
