from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from auth import get_password_hash

def recreate_admin():
    db = SessionLocal()
    try:
        # Check if Default Org exists
        org = db.query(models.Organization).filter(models.Organization.name == "Default Company").first()
        if not org:
            org = models.Organization(name="Default Company")
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Created Org: {org.name} (ID: {org.id})")
        else:
            print(f"Found Org: {org.name} (ID: {org.id})")

        # Create Admin User
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            admin = models.User(
                username="admin",
                full_name="System Admin",
                password_hash=get_password_hash("admin123"),
                is_admin=True,
                organization_id=org.id
            )
            db.add(admin)
            db.commit()
            print("Successfully created admin user.")
        else:
            print("Admin user already exists.")
            
        # Create khan1122 user (just in case)
        khan = db.query(models.User).filter(models.User.username == "khan1122").first()
        if not khan:
            khan = models.User(
                username="khan1122",
                full_name="Faisal Ahmad",
                password_hash=get_password_hash("khan10112"),
                is_admin=True,
                organization_id=org.id
            )
            db.add(khan)
            db.commit()
            print("Successfully created khan1122 user.")
            
    finally:
        db.close()

if __name__ == "__main__":
    recreate_admin()
