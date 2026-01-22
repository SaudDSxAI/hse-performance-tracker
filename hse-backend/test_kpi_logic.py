
import os
import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import Candidate, MonthlyKPI
from datetime import date

# Setup
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# In-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./kpi_test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_kpi_history_issue():
    logger.info("--- Testing KPI History Retrieval ---")
    
    # 1. Init DB
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 2. Create Candidate
    # Creating directly in DB to save time, or via API
    # Let's use API to be integrating project id logic
    # Need project first
    p_resp = client.post("/api/projects/", json={"name": "KPI PROJ"}).json()
    p_id = p_resp["id"]
    
    c_resp = client.post("/api/candidates/", json={"name": "KPI CANDIDATE", "project_id": p_id}).json()
    c_id = c_resp["id"]
    
    # 3. Add KPIs for two different months
    # Month 1: Jan 2024
    kpi_jan = {
        "candidate_id": c_id,
        "month": "2024-01-01",
        "observations_open": 10,
        "violations": 5
    }
    client.post("/api/monthly-kpis", json=kpi_jan)
    
    # Month 2: Feb 2024 (LATEST)
    kpi_feb = {
        "candidate_id": c_id,
        "month": "2024-02-01",
        "observations_open": 20,
        "violations": 8
    }
    client.post("/api/monthly-kpis", json=kpi_feb)
    
    # 4. Fetch Candidate Data
    logger.info(f"Fetching data for project {p_id}...")
    resp = client.get(f"/api/candidates/project/{p_id}")
    data = resp.json()
    candidate_data = data[0]
    
    logger.info("Verifying Monthly KPIs structure...")
    kpis = candidate_data.get("monthlyKPIs", {})
    logger.info(f"Received KPIs: {kpis}")
    
    # 5. Assertions
    # Current implementation only returns the latest (Feb) flattened
    if "observationsOpen" in kpis:
        # It's the flattened structure
        val = kpis["observationsOpen"]
        logger.info(f"observationsOpen value: {val}")
        
        if val == 20:
            logger.warning("ISSUE CONFIRMED: API only returns the latest month (Feb, val=20). Jan data (val=10) is inaccessible.")
            sys.exit(1) # Fail script to indicate issue found
        else:
            logger.info("Value distinct from latest... investigation needed.")
    else:
        # Maybe it IS a dict (what we want)
        if "2024-01-01" in kpis and "2024-02-01" in kpis:
            logger.info("SUCCESS: API returns full history map!")
        else:
            logger.error(f"Unknown structure: {kpis}")

if __name__ == "__main__":
    try:
        test_kpi_history_issue()
    except Exception as e:
        logger.error(f"Test failed with error: {e}")
    finally:
        if os.path.exists("./kpi_test.db"):
            os.remove("./kpi_test.db")
