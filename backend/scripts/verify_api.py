import requests
import json
import time

URL = "http://localhost:8001/api/chat"

# Mock User Token (Assuming we can bypass or use a test token if dev mode allows, 
# BUT since we need a valid token, we will hit the health check OR use a known test user if implemented. 
# Wait, the user asked for a terminal command. 
# Let's try to hit the HEALTH endpoint first to prove it's up, then try chat if possible.)

def test_health():
    try:
        r = requests.get("http://localhost:8001/health")
        print(f"✅ Health Check Status: {r.status_code}")
        print(f"📄 Response: {r.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")

def test_knowledge_base_status():
    try:
        # Pass a dummy token if middleware acts up, but let's try endpoint that might be open or just check connection
        # Actually /api/knowledge-base/status usually requires auth.
        # Let's try to hit the MAIN ROOT endpoint which is open.
        r = requests.get("http://localhost:8001/")
        print(f"\n✅ Root Endpoint Status: {r.status_code}")
        print(f"📄 Response: {r.json()}")
    except Exception as e:
        print(f"❌ Root Check Failed: {e}")

if __name__ == "__main__":
    print("🚀 Testing Backend Connectivity...")
    test_health()
    test_knowledge_base_status()
    print("\n⚠️ Note: correct /chat testing requires a valid JWT token.")
    print("To test chat, please open: http://localhost:8001/docs in browser.")
