"""
Script to initialize the knowledge base
Run this once to index all PDFs in /data folder
"""
import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.rag.pipeline import rebuild_vector_db

if __name__ == "__main__":
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(backend_dir, "data")
    
    print(f"📂 Data directory: {data_dir}")
    
    if not os.path.exists(data_dir):
        print("❌ Data folder not found!")
        sys.exit(1)
    
    pdf_files = [f for f in os.listdir(data_dir) if f.endswith('.pdf')]
    print(f"📄 Found {len(pdf_files)} PDF files:")
    for f in pdf_files:
        print(f"   - {f}")
        
    # --- SMART CHECK: If pickle exists, skip rebuild to SAVE QUOTA ---
    pickle_path = os.path.join(backend_dir, "chroma_db.pkl")
    if os.path.exists(pickle_path):
        print(f"\n🥒 Found Pickle File: {pickle_path}")
        print("✅ Skipping Jina API Indexing (Zero Quota Mode)")
        print("🚀 Render will load from Pickle at runtime.")
        sys.exit(0)
    
    print("\n🔄 Starting indexing...")
    db = rebuild_vector_db(data_dir)
    
    if db:
        print("✅ Knowledge base created successfully!")
        print(f"📍 ChromaDB saved to: {os.path.join(backend_dir, 'chroma_db')}")
    else:
        print("❌ Failed to create knowledge base")
