import pickle
import os
import sys

# Get backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pickle_path = os.path.join(backend_dir, "chroma_db.pkl")

print(f"Checking pickle at: {pickle_path}")

try:
    with open(pickle_path, 'rb') as f:
        data = pickle.load(f)
    
    print("-" * 30)
    print("KEYS IN PICKLE:")
    for k in data.keys():
        print(f" - {k}")
    
    print("-" * 30)
    print("DATA CHECKS:")
    ids = data.get('ids', [])
    print(f"IDs count: {len(ids)}")
    
    embeddings = data.get('embeddings', [])
    if embeddings is None:
        print("❌ EMBEDDINGS ARE NONE!")
    else:
        print(f"Embeddings count: {len(embeddings)}")
        if len(embeddings) > 0:
            print(f"First embedding type: {type(embeddings[0])}")
            if hasattr(embeddings[0], '__len__'):
                print(f"First embedding dim: {len(embeddings[0])}")
            else:
                print("❌ First embedding has no length!")
        else:
            print("⚠️ Embeddings list is empty!")

except Exception as e:
    print(f"❌ Failed to load pickle: {e}")
