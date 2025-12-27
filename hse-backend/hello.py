"""
Backend API Test Script
Tests all endpoints to verify they work correctly
"""

import requests
import json

# CHANGE THIS to your backend URL
BACKEND_URL = "https://hse-backend.up.railway.app"

def test_api():
    print("🔍 Testing HSE Backend API")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}\n")
    
    try:
        # Test 1: Root endpoint
        print("1️⃣ Testing root endpoint...")
        response = requests.get(f"{BACKEND_URL}/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Response: {response.json()}")
        else:
            print(f"   ❌ Failed: {response.text}")
        print()
        
        # Test 2: Get all projects
        print("2️⃣ Testing GET /api/projects...")
        response = requests.get(f"{BACKEND_URL}/api/projects")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            projects = response.json()
            print(f"   ✅ Found {len(projects)} project(s)")
            for p in projects:
                print(f"      • ID: {p.get('id')} | Name: {p.get('name')}")
            
            if len(projects) > 0:
                project_id = projects[0]['id']
                print(f"\n   Using project ID: {project_id} for further tests")
                
                # Test 3: Get candidates for project
                print(f"\n3️⃣ Testing GET /api/candidates/project/{project_id}...")
                response = requests.get(f"{BACKEND_URL}/api/candidates/project/{project_id}")
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        candidates = response.json()
                        print(f"   ✅ Found {len(candidates)} candidate(s)")
                        
                        # Show first 3 candidates
                        for i, c in enumerate(candidates[:3]):
                            print(f"      • ID: {c.get('id')} | Name: {c.get('name')} | Role: {c.get('role')}")
                        
                        # Check structure of first candidate
                        if len(candidates) > 0:
                            print(f"\n   📋 First candidate structure:")
                            first = candidates[0]
                            print(f"      Keys: {list(first.keys())}")
                            
                            # Check for section_ids (shouldn't be there)
                            if 'section_ids' in first:
                                print(f"      ⚠️  WARNING: section_ids found in response!")
                                print(f"         This will cause frontend issues!")
                            else:
                                print(f"      ✅ No section_ids (good!)")
                    except json.JSONDecodeError:
                        print(f"   ❌ Invalid JSON response")
                        print(f"   Raw response: {response.text[:500]}")
                else:
                    print(f"   ❌ Failed: {response.text}")
                    
                    # Try to see error details
                    try:
                        error = response.json()
                        print(f"   Error details: {json.dumps(error, indent=2)}")
                    except:
                        print(f"   Raw error: {response.text[:500]}")
                
        else:
            print(f"   ❌ Failed: {response.text}")
        print()
        
        # Test 4: Check API docs
        print("4️⃣ Testing API documentation...")
        response = requests.get(f"{BACKEND_URL}/docs")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ API docs accessible at {BACKEND_URL}/docs")
        else:
            print(f"   ❌ Failed")
        print()
        
        print("=" * 60)
        print("🎯 SUMMARY:")
        print("=" * 60)
        print("If candidates endpoint returns 500 error or empty:")
        print("  → Check backend logs on Railway")
        print("  → Verify all 3 files were uploaded correctly:")
        print("    • main.py (no AddingSections import)")
        print("    • schemas.py (has 23 fields, no section schemas)")
        print("    • AddingCandidates.py (no section_ids)")
        print("\nIf section_ids appears in candidate response:")
        print("  → Backend has old AddingCandidates.py")
        print("  → Re-upload the fixed version")
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {BACKEND_URL}")
        print("   Is the backend running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()