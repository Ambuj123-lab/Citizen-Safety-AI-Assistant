
import os
import sys
from pathlib import Path

# Add parent dir to path to import config
sys.path.append(str(Path(__file__).parent.parent))

from app.config import Settings
import google.generativeai as genai

def list_available_models():
    settings = Settings()
    api_key = settings.GOOGLE_API_KEY
    
    if not api_key:
        print("❌ GOOGLE_API_KEY not found in settings!")
        return

    print(f"🔑 Checking models for API Key ending in: ...{api_key[-4:]}")
    
    try:
        genai.configure(api_key=api_key)
        
        print("\n📡 Fetching available models from Google...")
        models = genai.list_models()
        
        found_any = False
        print("\n✅ Available Generate Content Models:")
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                print(f"   - {m.name} (Display: {m.display_name})")
                found_any = True
                
        if not found_any:
            print("⚠️ No models found that support 'generateContent'. Check API Key permissions.")
            
    except Exception as e:
        print(f"\n❌ Error fetching models: {e}")

if __name__ == "__main__":
    list_available_models()
