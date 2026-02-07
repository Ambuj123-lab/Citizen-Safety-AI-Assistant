import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

def count_vectors():
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ API Key not found!")
        return

    pc = Pinecone(api_key=api_key)
    index = pc.Index("citizen-safety")
    
    stats = index.describe_index_stats()
    print("📊 Pinecone Index Stats:")
    print(stats)
    
    total = stats['total_vector_count']
    namespaces = stats.get('namespaces', {})
    core = namespaces.get('core-brain', {}).get('vector_count', 0)
    
    print(f"\n✅ Total Vectors: {total}")
    print(f"🧠 Core Brain (PDFs) Vectors: {core}")

if __name__ == "__main__":
    count_vectors()
