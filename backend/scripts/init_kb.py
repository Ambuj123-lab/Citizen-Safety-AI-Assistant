"""
Script to initialize/verify the knowledge base connection (Pinecone)
"""
import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.rag.pipeline import get_vector_db

if __name__ == "__main__":
    print("🚀 Verifying Pinecone Connection...")
    
    try:
        db = get_vector_db()
        if db:
            print("✅ Pinecone Connected Successfully!")
            print("   - Index: citizen-safety")
            print("   - Namespace: core-brain")
            sys.exit(0)
        else:
            print("❌ Failed to connect to Pinecone.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
