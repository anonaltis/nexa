
import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GENAI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not GENAI_API_KEY:
    print("❌ No API Key found in .env")
    exit()

print(f"🔑 Using API Key ending in: ...{GENAI_API_KEY[-5:]}")

client = genai.Client(api_key=GENAI_API_KEY)

async def test_chat():
    print("🚀 Sending request to Gemini...")
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents="Hello! Are you working?"
        )
        print("\n✅ Response received:")
        print("-" * 20)
        print(response.text)
        print("-" * 20)
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())
