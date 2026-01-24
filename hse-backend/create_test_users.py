"""
Script to create test users for each role (Admin, Lead, Viewer)
Run this once to set up test accounts
"""
from auth import get_password_hash
from database import SessionLocal
from models import User

def create_test_users():
    db = SessionLocal()
    
    # Define test users for organization 1
    test_users = [
        {"username": "testlead", "full_name": "Test Lead User", "email": "lead@test.com", "role": "lead"},
        {"username": "testviewer", "full_name": "Test Viewer User", "email": "viewer@test.com", "role": "viewer"},
    ]
    
    password_hash = get_password_hash("test123")
    
    for user_data in test_users:
        # Check if user exists
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if existing:
            print(f"User {user_data['username']} already exists, skipping...")
            continue
        
        new_user = User(
            username=user_data["username"],
            full_name=user_data["full_name"],
            email=user_data["email"],
            role=user_data["role"],
            password_hash=password_hash,
            organization_id=1,  # Same org as admin
            is_admin=False
        )
        db.add(new_user)
        print(f"✅ Created user: {user_data['username']} (Role: {user_data['role']})")
    
    db.commit()
    db.close()
    
    print("\n" + "="*50)
    print("🎉 TEST USERS CREATED!")
    print("="*50)
    print("\nYou can now login with these accounts:")
    print("-" * 50)
    print("| Username     | Password | Role    |")
    print("-" * 50)
    print("| admin        | admin123 | Admin   |")
    print("| testlead     | test123  | Lead    |")
    print("| testviewer   | test123  | Viewer  |")
    print("-" * 50)
    print("\nEach role has different permissions:")
    print("• Admin: Full access (add, edit, delete, manage team)")
    print("• Lead: Can add/edit but cannot delete")
    print("• Viewer: Read-only access")
    print("="*50)

if __name__ == "__main__":
    create_test_users()
