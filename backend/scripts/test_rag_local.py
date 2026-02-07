import os
import sys
# Set root dir
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)

import asyncio
from app.rag.pipeline import search_and_respond
from app.config import get_settings

def test_rag_pipeline():
    print(f"🚀 Testing RAG Logic Locally (Direct Function Call)...")
    
    question = "What is the IPC section for stalking?"
    print(f"❓ Question: {question}")
    
    # This calls the RAG function directly (bypassing Auth/API)
    result = search_and_respond(question, user_name="TestUser")
    
    if result.get("error"):
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Success! Response Received.")
        print(f"🤖 Answer: {result['response'][:150]}...") # truncate for cli
        
        print(f"\n📚 Sources Used:")
        for s in result.get("sources", []):
            print(f"   - File: {s['file']} (Page {s['page']})")
            
        print(f"\n🔍 Check your logs above for 'Retrieved from Pinecone' message!")

if __name__ == "__main__":
    test_rag_pipeline()
