import os
import sys
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import get_settings
settings = get_settings()

print(f"🔑 Creating embeddings with key: {settings.GOOGLE_API_KEY[:5]}...{settings.GOOGLE_API_KEY[-5:]}")

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    
    print("🚀 Initializing Google Embeddings...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.GOOGLE_API_KEY
    )
    
    print("🧪 Testing embedding with 1 text chunk...")
    text = "This is a test sentence to verify API connectivity."
    
    start = time.time()
    vector = embeddings.embed_query(text)
    end = time.time()
    
    print(f"✅ Success! Vector length: {len(vector)}")
    print(f"⏱️ Time taken: {end - start:.2f} seconds")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
