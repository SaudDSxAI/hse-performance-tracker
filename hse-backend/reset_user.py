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

def reset_user():
    username = "khan1122"
    new_password = "khan10112"
    password_hash = get_password_hash(new_password)
    
    with engine.connect() as conn:
        # Check if user exists
        user = conn.execute(text("SELECT id FROM users WHERE username = :u"), {"u": username}).fetchone()
        
        if user:
            # Update password
            conn.execute(text("""
                UPDATE users 
                SET password_hash = :p 
                WHERE username = :u
            """), {
                "u": username,
                "p": password_hash
            })
            conn.commit()
            print(f"✅ User '{username}' password reset to '{new_password}'")
        else:
            print(f"❌ User '{username}' not found.")

if __name__ == "__main__":
    reset_user()
