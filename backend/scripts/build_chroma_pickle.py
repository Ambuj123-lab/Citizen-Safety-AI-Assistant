"""
Build ChromaDB from PDFs and save to pickle file.
Run this ONCE locally to generate chroma_db.pkl for deployment.

Usage:
    cd backend
    python scripts/build_chroma_pickle.py
"""

import os
import pickle
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import JinaEmbeddings
from app.config import Settings
import time

# Initialize settings
settings = Settings()

# Define ResilientJinaEmbeddings locally (same as in pipeline.py)
class ResilientJinaEmbeddings(JinaEmbeddings):
    def _embed(self, texts):
        """Override _embed with enhanced retry logic for network resilience"""
        max_retries = 5
        for attempt in range(max_retries):
            try:
                return super()._embed(texts)
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"❌ Jina API failed after {max_retries} attempts: {e}")
                    raise
                wait_time = 3 * (2 ** attempt)
                print(f"⚠️  Jina API attempt {attempt + 1}/{max_retries} failed, retrying in {wait_time}s...")
                time.sleep(wait_time)

def build_and_save_chromadb():
    """Build ChromaDB from PDFs and save to pickle file"""
    
    print("=" * 60)
    print("ChromaDB Pickle Builder")
    print("=" * 60)
    
    # Paths
    data_dir = Path(__file__).parent.parent / "data"
    pickle_path = Path(__file__).parent.parent / "chroma_db.pkl"
    
    print(f"\n📁 Data directory: {data_dir}")
    print(f"💾 Pickle output: {pickle_path}")
    
    # Check data directory
    if not data_dir.exists():
        print(f"\n❌ Error: Data directory not found: {data_dir}")
        return False
    
    # Load PDFs
    pdf_files = list(data_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"\n❌ Error: No PDF files found in {data_dir}")
        return False
    
    print(f"\n📄 Found {len(pdf_files)} PDF files:")
    for pdf in pdf_files:
        print(f"   - {pdf.name}")
    
    # Load documents
    print("\n📖 Loading documents...")
    all_docs = []
    for pdf_path in pdf_files:
        try:
            loader = PyMuPDFLoader(str(pdf_path))
            docs = loader.load()
            all_docs.extend(docs)
            print(f"   ✅ Loaded {len(docs)} pages from {pdf_path.name}")
        except Exception as e:
            print(f"   ❌ Failed to load {pdf_path.name}: {e}")
    
    if not all_docs:
        print("\n❌ Error: No documents loaded!")
        return False
    
    print(f"\n📚 Total pages loaded: {len(all_docs)}")
    
    # Chunk documents
    print("\n✂️  Chunking documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = text_splitter.split_documents(all_docs)
    print(f"   ✅ Created {len(chunks)} chunks")
    
    # Create embeddings (uses Jina API)
    print("\n🔧 Initializing Jina Embeddings...")
    print("   ⚠️  This will use Jina API quota (ONE TIME ONLY!)")
    embeddings = ResilientJinaEmbeddings(
        jina_api_key=settings.JINA_API_KEY,
        model_name="jina-embeddings-v2-base-en"
    )
    
    # Build ChromaDB
    print("\n🏗️  Building ChromaDB (this may take 2-5 minutes)...")
    print("   📡 Calling Jina API for embeddings...")
    
    try:
        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name="citizen_safety_docs"
        )
        print(f"   ✅ ChromaDB built successfully!")
        print(f"   📊 Document count: {vector_db._collection.count()}")
    except Exception as e:
        print(f"\n❌ Error building ChromaDB: {e}")
        return False
    
    # Save to pickle (RAW DATA ONLY, not ChromaDB object!)
    print(f"\n💾 Extracting raw data from ChromaDB...")
    try:
        # Extract all data from ChromaDB collection - EXPLICITLY include embeddings!
        chroma_data = vector_db.get(include=['embeddings', 'documents', 'metadatas'])
        
        # Package data for pickling
        data_to_pickle = {
            'ids': chroma_data['ids'],
            'embeddings': chroma_data['embeddings'],
            'documents': chroma_data['documents'],
            'metadatas': chroma_data['metadatas'],
            'collection_name': 'citizen_safety_docs'
        }
        
        print(f"   ✅ Extracted data:")
        print(f"   📊 IDs: {len(data_to_pickle['ids'])}")
        print(f"   📊 Embeddings: {len(data_to_pickle['embeddings'])}")
        print(f"   📊 Documents: {len(data_to_pickle['documents'])}")
        
        # Save raw data to pickle
        print(f"\n💾 Saving raw data to pickle file...")
        with open(pickle_path, 'wb') as f:
            pickle.dump(data_to_pickle, f, protocol=pickle.HIGHEST_PROTOCOL)
        
        file_size_mb = pickle_path.stat().st_size / (1024 * 1024)
        print(f"   ✅ Saved successfully!")
        print(f"   📦 File size: {file_size_mb:.2f} MB")
        
        if file_size_mb > 100:
            print(f"\n   ⚠️  WARNING: File size > 100MB, Git might reject it!")
        
    except Exception as e:
        print(f"\n❌ Error saving pickle: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Verify pickle
    print(f"\n🔍 Verifying pickle file...")
    try:
        with open(pickle_path, 'rb') as f:
            loaded_data = pickle.load(f)
        
        doc_count = len(loaded_data['ids'])
        print(f"   ✅ Verification successful!")
        print(f"   📊 Loaded {doc_count} documents from pickle")
        print(f"   📏 Sample document: {loaded_data['documents'][0][:100]}...")
    except Exception as e:
        print(f"\n❌ Error verifying pickle: {e}")
        return False
    
    # Success!
    print("\n" + "=" * 60)
    print("✅ SUCCESS!")
    print("=" * 60)
    print(f"\n📦 Pickle file created: {pickle_path}")
    print(f"📏 Size: {file_size_mb:.2f} MB")
    print(f"📊 Documents: {doc_count}")
    print(f"\n🚀 Next steps:")
    print(f"   1. git add {pickle_path.relative_to(Path.cwd().parent)}")
    print(f"   2. git commit -m 'feat: Add ChromaDB pickle for zero-rebuild deploys'")
    print(f"   3. git push origin main")
    print(f"\n💡 Render will now load this pickle on every deployment!")
    print(f"   No more rebuilding 621 chunks! 🎉")
    
    return True

if __name__ == "__main__":
    success = build_and_save_chromadb()
    sys.exit(0 if success else 1)
