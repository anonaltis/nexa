import os
import asyncio
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

GENAI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GENAI_API_KEY)

async def test_chat():
    print("🚀 Sending request to Gemini (Stable Model)...")
    # Stable model use karein jis ka quota zyada hota hai
    model_id = 'gemini-1.5-flash' 
    
    try:
        response = client.models.generate_content(
            model=model_id, 
            contents="Hello! Give me a quick electronics tip for ESP32."
        )
        print("\n✅ Response received:")
        print(response.text)
    except Exception as e:
        if "429" in str(e):
            print("\n❌ Quota Error: Model busy ya limit full. 10 seconds wait kar ke try karein.")
        else:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())