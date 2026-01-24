from auth import get_password_hash
from database import SessionLocal
from models import User

def reset_passwords():
    db = SessionLocal()
    users = db.query(User).all()
    for user in users:
        print(f"Resetting password for {user.username}...")
        user.password_hash = get_password_hash("admin123")
    db.commit()
    db.close()
    print("Done.")

if __name__ == "__main__":
    reset_passwords()
