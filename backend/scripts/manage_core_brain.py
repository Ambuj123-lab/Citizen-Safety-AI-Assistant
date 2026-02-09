"""
Script to Manage Core Brain (Permanent Knowledge Base) in Pinecone.
Allows adding new files or updating existing ones without full re-indexing.

Usage:
    python manage_core_brain.py --file "path/to/file.pdf"
"""
import os
import sys
import argparse
import time
from dotenv import load_dotenv
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone
from app.rag.pipeline import get_vector_db, get_embeddings
from app.config import get_settings

load_dotenv()
settings = get_settings()

def manage_core_file(file_path: str, is_update: bool = False):
    """
    Surgically add or update a file in the Core Brain.
    1. Checks if file exists locally.
    2. Deletes OLD vectors for this file from Pinecone (to prevent duplicates).
    3. Uploads NEW vectors to Pinecone.
    """
    # CRITICAL: Convert to absolute path FIRST
    # PyMuPDFLoader stores absolute path in 'source' metadata
    # Delete must use the same absolute path to find existing vectors
    file_path = os.path.abspath(file_path)
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return

    filename = os.path.basename(file_path)
    print(f"🚀 Processing Core Brain File: {filename}")
    print(f"   📁 Resolved Path: {file_path}")
    
    # 1. Initialize Pinecone Client (for deletion)
    try:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        index = pc.Index("citizen-safety")
    except Exception as e:
        print(f"❌ Failed to connect to Pinecone: {e}")
        return

    # 2. DELETE Existing Vectors (The "Surgical Strike")
    # We do this for BOTH add (just in case) and update operations.
    # This prevents "Zombie Chunks" if the file was already there.
    print(f"🧹 Cleaning existing knowledge for: {filename}...")
    try:
        # Note: We do NOT use 'is_temporary' filter here because these are Core files.
        # We delete by 'source' metadata to ensure no duplicates.
        index.delete(
            filter={"source": file_path, "is_temporary": {"$ne": True}}, 
            namespace="core-brain"
        )
        # Actually, let's just delete by source.
        # But wait! If we upload from Windows vs Linux, paths change.
        # PyMuPDFLoader stores absolute path in 'source'.
        # If I upload 'data/IPC.pdf', source is '.../data/IPC.pdf'.
        # If I act on 'data/IPC.pdf' now, it matches.
        index.delete(
            filter={"source": file_path},
            namespace="core-brain"
        )
        print("   ✅ Old data cleared (if any).")
    except Exception as e:
        print(f"⚠️ Warning during deletion (might be first time upload): {e}")

    # 3. Process & Upload New Data
    print("📖 Loading and Chunking PDF...")
    try:
        loader = PyMuPDFLoader(file_path)
        docs = loader.load()
        
        # Tag Metadata
        for d in docs:
            d.metadata["source"] = file_path # Ensure exact match for future deletion
            # d.metadata["is_temporary"] = False # Implicitly False if missing.
            d.metadata["upload_timestamp"] = datetime.now().isoformat()
            d.metadata["category"] = "core-law"
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        chunks = text_splitter.split_documents(docs)
        print(f"   wd - Created {len(chunks)} chunks.")
        
        # Upload
        print("☁️ Uploading to Pinecone Core Brain...")
        vector_db = get_vector_db()
        vector_db.add_documents(chunks)
        print(f"🎉 SUCCESS: '{filename}' is now part of the Core Brain!")
        
    except Exception as e:
        print(f"❌ Error during processing: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage Core Brain Documents")
    parser.add_argument("--file", type=str, required=True, help="Path to the PDF file")
    
    args = parser.parse_args()
    
    manage_core_file(args.file)
