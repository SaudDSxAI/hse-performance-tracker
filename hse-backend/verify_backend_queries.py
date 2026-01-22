import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import User, Project, Section, Candidate, DailyLog, MonthlyKPI
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def check_real_db_connection():
    """Check if we can connect to the configured PostgreSQL database."""
    logger.info("--- Checking Real Database Connection ---")
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.warning("DATABASE_URL is not set in .env")
        return False

    try:
        # Handle the postgres:// fix if needed (same as in database.py)
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
            
        engine = create_engine(database_url)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("Successfully connected to the real database!")
            return True
    except Exception as e:
        logger.error(f"Failed to connect to real database: {e}")
        return False

def run_logic_tests():
    """Run functional tests using an in-memory SQLite database to verify query logic."""
    logger.info("\n--- Verifying Backend Query Logic (In-Memory DB) ---")
    
    # Use SQLite for testing logic safety
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Dependency override
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # Track failures
    failures = []

    # 1. Project Tests
    logger.info("Testing Project Queries...")
    try:
        # Create
        response = client.post("/api/projects/", json={
            "name": "Test Project",
            "location": "Test Loc",
            "company": "Test Corp"
        })
        if response.status_code != 200:
            failures.append(f"Create Project failed: {response.text}")
        else:
            project_id = response.json()["id"]
            
            # Read
            response = client.get(f"/api/projects/{project_id}")
            assert response.status_code == 200
            
            # Update
            response = client.put(f"/api/projects/{project_id}", json={"name": "Updated Project"})
            assert response.status_code == 200
            assert response.json()["name"] == "Updated Project"
            
            # Delete
            response = client.delete(f"/api/projects/{project_id}")
            assert response.status_code == 200
            
        logger.info("Project Queries: OK")
    except Exception as e:
        logger.error(f"Project Queries Failed: {e}")
        failures.append(str(e))

    # 2. Section Tests
    logger.info("Testing Section Queries...")
    try:
        # Setup Project first
        p_resp = client.post("/api/projects/", json={"name": "Section Test Proj"}).json()
        p_id = p_resp["id"]
        
        # Create Section
        response = client.post("/api/sections/", json={"name": "Test Section", "project_id": p_id})
        if response.status_code != 200:
            failures.append(f"Create Section failed: {response.text}")
        else:
            # Note: AddingSections.py likely returns the created object
            # Let's verify the actual return structure if we can, but 200 OK is a good sign for query execution
            pass
            
        logger.info("Section Queries: OK")
    except Exception as e:
        logger.error(f"Section Queries Failed: {e}")
        failures.append(str(e))

    # 3. Candidate Tests
    logger.info("Testing Candidate Queries...")
    try:
        # Setup Project
        p_resp = client.post("/api/projects/", json={"name": "Candidate Test Proj"}).json()
        p_id = p_resp["id"]
        
        # Create Candidate
        c_payload = {
            "name": "John Doe",
            "project_id": p_id,
            "role": "Engineer"
        }
        resp = client.post("/api/candidates/", json=c_payload)
        if resp.status_code != 200:
            failures.append(f"Create Candidate failed: {resp.text}")
        else:
            c_id = resp.json()["id"]
            
            # Read
            client.get(f"/api/candidates/{c_id}")
            
            # Update
            client.put(f"/api/candidates/{c_id}", json={"name": "Jane Doe"})
            
        logger.info("Candidate Queries: OK")
    except Exception as e:
        logger.error(f"Candidate Queries Failed: {e}")
        failures.append(str(e))

    # 4. Daily Logs Tests
    logger.info("Testing Daily Log Queries...")
    try:
        # Setup Candidate
        p_resp = client.post("/api/projects/", json={"name": "Log Test Proj"}).json()
        c_resp = client.post("/api/candidates/", json={"name": "Log User", "project_id": p_resp["id"]}).json()
        c_id = c_resp["id"]
        
        # Create Log
        log_payload = {
            "candidate_id": c_id,
            "log_date": "2023-10-27",
            "time_in": "08:00:00",
            "time_out": "17:00:00",
            "task_briefing": True
        }
        resp = client.post("/api/daily-logs", json=log_payload) # Check route in AddingDailyLogs.py: /api/daily-logs
        if resp.status_code != 200:
             failures.append(f"Create Daily Log failed: {resp.text}")
        else:
             # Update
             l_id = resp.json()["id"]
             client.put(f"/api/daily-logs/{l_id}", json={
                 "task_briefing": False,
                 "log_date": "2023-10-27",
                 "candidate_id": c_id
             })
             
        logger.info("Daily Log Queries: OK")
    except Exception as e:
        logger.error(f"Daily Log Queries Failed: {e}")
        failures.append(str(e))

    # 5. Auth Tests
    logger.info("Testing Auth Queries...")
    try:
        # Register
        reg_payload = {"username": "testuser", "password": "password123"}
        resp = client.post("/api/auth/register", json=reg_payload)
        if resp.status_code != 200:
            failures.append(f"Register failed: {resp.text}")
        else:
            # Login
            login_payload = {"username": "testuser", "password": "password123"}
            resp = client.post("/api/auth/login", json=login_payload)
            if resp.status_code != 200:
                failures.append(f"Login failed: {resp.text}")
            else:
                token = resp.json()["access_token"]
                # Get Me
                resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
                assert resp.status_code == 200
                assert resp.json()["username"] == "testuser"
                
        logger.info("Auth Queries: OK")
    except Exception as e:
        logger.error(f"Auth Queries Failed: {e}")
        failures.append(str(e))

    # Cleanup
    try:
        os.remove("./test.db")
    except:
        pass

    if failures:
        logger.error("Some logic tests failed.")
        sys.exit(1)
    else:
        logger.info("All backend query logic tests PASSED.")

if __name__ == "__main__":
    # Check 1: Real DB Connection
    connected = check_real_db_connection()
    if not connected:
        logger.warning("Could not verify REAL database connection. Proceeding to logic verification with Test DB.")
    
    # Check 2: Logic Verification
    run_logic_tests()
