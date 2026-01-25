
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

GENAI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not GENAI_API_KEY:
    print("No API Key found")
    exit()

try:
    client = genai.Client(api_key=GENAI_API_KEY)
    # Using the low-level API or just trying a simple generation to test common names
    
    print("Listing available models:")
    try:
        # Pager object
        for m in client.models.list(config={'page_size': 100}):
            print(f"- {m.name}")
    except Exception as e:
        print(f"List failed: {e}")

except Exception as e:
    print(f"Client init failed: {e}")
