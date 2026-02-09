import sys
import os
import time

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.auth.jwt import create_access_token

client = TestClient(app)

def test_caching():
    # 1. Create a dummy user token
    token = create_access_token(data={"sub": "test@example.com", "name": "Test User", "email": "test@example.com"})
    headers = {"Authorization": f"Bearer {token}"}
    
    question = "What is the IPC section for stalking?"
    
    # --- STEP 1: First Call (Should be a CACHE MISS) ---
    print("\n--- [Step 1] First Call (Expecting Cache Miss) ---")
    start_time = time.time()
    response = client.post("/api/chat", json={"message": question}, headers=headers)
    end_time = time.time()
    
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Is Cached: {data.get('is_cached')}")
    print(f"Time Taken: {end_time - start_time:.2f}s")
    
    if data.get('is_cached') is True:
        print("⚠️ Warning: Got cache hit on first call. Cache might already exist.")
    
    # --- STEP 2: Second Call (Should be a CACHE HIT) ---
    print("\n--- [Step 2] Second Call (Expecting Cache Hit) ---")
    start_time = time.time()
    response = client.post("/api/chat", json={"message": question}, headers=headers)
    end_time = time.time()
    
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Is Cached: {data.get('is_cached')}")
    print(f"Time Taken: {end_time - start_time:.2f}s")
    
    if data.get('is_cached') is not True:
        print("❌ Error: Expected cache hit on second call!")
    else:
        print("✅ Success: Cache hit detected!")

    # --- STEP 3: Bypass Call (Should be a CACHE MISS) ---
    print("\n--- [Step 3] Bypass Call (Expecting Cache Miss) ---")
    headers["X-Bypass-Cache"] = "true"
    start_time = time.time()
    response = client.post("/api/chat", json={"message": question}, headers=headers)
    end_time = time.time()
    
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Is Cached: {data.get('is_cached')}")
    print(f"Time Taken: {end_time - start_time:.2f}s")
    
    if data.get('is_cached') is False:
        print("✅ Success: Cache bypass working!")
    else:
        print("❌ Error: Cache bypass failed!")

if __name__ == "__main__":
    test_caching()
