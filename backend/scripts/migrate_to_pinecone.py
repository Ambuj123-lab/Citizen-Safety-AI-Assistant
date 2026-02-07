import os
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import JinaEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore

# Load environment variables
load_dotenv()

# Configuration
# Path to your data folder
# Robust path finding: assumes script is in backend/scripts/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up one level to backend, then into data
DATA_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "data")

INDEX_NAME = "citizen-safety"
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
JINA_API_KEY = os.getenv("JINA_API_KEY")

if not PINECONE_API_KEY:
    raise ValueError("❌ PINECONE_API_KEY not found in .env")

if not JINA_API_KEY:
    raise ValueError("❌ JINA_API_KEY not found in .env")

def migrate():
    print("🚀 Starting Migration to Pinecone...")
    
    # 1. Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    # Check if index exists
    existing_indexes = [index.name for index in pc.list_indexes()]
    if INDEX_NAME not in existing_indexes:
        print(f"⚠️ Index '{INDEX_NAME}' not found. Creating it now...")
        try:
            pc.create_index(
                name=INDEX_NAME,
                dimension=768, # Jina embedding dimension
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            print("⏳ Index creating... waiting 20s to be ready...")
            time.sleep(20) 
        except Exception as e:
            print(f"⚠️ Could not automatically create index (might involve billing/region settings). Error: {e}")
            print("👉 Please ensure index exists in dashboard!")
    else:
        print(f"✅ Found existing index: '{INDEX_NAME}'")

    # 2. Load PDFs
    print(f"📂 Reading PDFs from {DATA_DIR}...")
    if not os.path.exists(DATA_DIR):
        print(f"❌ Data directory not found at {DATA_DIR}")
        return
        
    loader = PyPDFDirectoryLoader(DATA_DIR)
    docs = loader.load()
    
    if not docs:
         print("⚠️ No documents found in data directory! Please check if PDFs exist.")
         return

    print(f"✅ Loaded {len(docs)} pages.")

    # 3. Chunk Data
    print("✂️ Chunking data...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)
    print(f"✅ Created {len(splits)} chunks.")

    # 4. Initialize Embedding Model
    print("🧠 Initializing Jina Embeddings...")
    embeddings = JinaEmbeddings(
        jina_api_key=JINA_API_KEY,
        model_name="jina-embeddings-v2-base-en"
    )

    # 5. Upsert to Pinecone (Using LangChain wrapper for ease)
    print(f"☁️ Uploading {len(splits)} chunks to Pinecone...")
    print("☕ This might take a minute...")
    
    try:
        # We use LangChain's wrapper which handles batching automatically
        PineconeVectorStore.from_documents(
            documents=splits,
            embedding=embeddings,
            index_name=INDEX_NAME,
            namespace="core-brain" # Separation from user temp data
        )
        print("🎉 SUCCESS: All data migrated to Pinecone 'core-brain' namespace!")
    except Exception as e:
        print(f"❌ Error uploading to Pinecone: {e}")

if __name__ == "__main__":
    migrate()
