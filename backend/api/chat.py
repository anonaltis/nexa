
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import uuid
from auth_utils import get_current_user

router = APIRouter()

class PollOption(BaseModel):
    id: str
    label: str
    description: Optional[str] = None

class PollData(BaseModel):
    question: str
    options: List[PollOption]

class ChatMessageRequest(BaseModel):
    content: str
    projectId: Optional[str] = None

class ChatMessageMetadata(BaseModel):
    type: Optional[str] = None # 'poll', 'question', etc.
    pollOptions: Optional[List[dict]] = None
    selectedOption: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime
    metadata: Optional[dict] = None

# Mock Responses (moved from frontend)
MOCK_RESPONSES = [
    {
        "content": "Great! Let me help you plan your electronics project. First, I need to understand what you're building.",
        "poll": {
            "type": "poll",
            "pollOptions": [
                {"id": "1", "label": "IoT / Smart Home", "description": "Connected devices, sensors, automation"},
                {"id": "2", "label": "Robotics", "description": "Motors, actuators, motion control"},
                {"id": "3", "label": "Audio / Video", "description": "Amplifiers, displays, media"},
                {"id": "4", "label": "Power Electronics", "description": "Power supplies, converters, chargers"},
            ]
        }
    },
    {
        "content": "Excellent choice! Now let me understand the scope better.",
        "poll": {
            "type": "poll",
            "pollOptions": [
                {"id": "1", "label": "Beginner", "description": "First few projects, learning basics"},
                {"id": "2", "label": "Intermediate", "description": "Comfortable with soldering, basic circuits"},
                {"id": "3", "label": "Advanced", "description": "Design my own PCBs, work with SMD"},
            ]
        }
    },
    {
        "content": "Perfect! Based on your requirements, here's your project plan:\n\n## Project: Smart Temperature Monitor\n\n### Components Needed:\n- ESP32 DevKit v1\n- DHT22 Temperature/Humidity Sensor\n- 0.96\" OLED Display (I2C)\n- 10kΩ Resistor\n- Breadboard & Jumper Wires\n\n### Estimated Cost: $15-25\n\n### Connections:\n1. DHT22 VCC → ESP32 3.3V\n2. DHT22 GND → ESP32 GND\n3. DHT22 DATA → ESP32 GPIO4\n4. OLED SDA → ESP32 GPIO21\n5. OLED SCL → ESP32 GPIO22\n\nWould you like me to generate the PCB diagram and code?",
        "poll": None
    }
]

import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GENAI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
client = None
if GENAI_API_KEY:
    try:
        client = genai.Client(api_key=GENAI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")

@router.post("/message", response_model=ChatMessageResponse)
async def chat_message(request: ChatMessageRequest, current_user: str = Depends(get_current_user)):
    
    if not client:
         # Fallback if API key is missing
         return {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "⚠️ Gemini API Key is missing. Please add GEMINI_API_KEY to your backend .env file.",
            "timestamp": datetime.utcnow()
        }

    if GENAI_API_KEY:
        print(f"DEBUG: Using Gemini API Key starting with: {GENAI_API_KEY[:4]}...")
    
    import asyncio
    
    # Check for explicit MOCK mode
    if GENAI_API_KEY == "MOCK":
        await asyncio.sleep(1) # Simulate delay
        return {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "🤖 **MOCK MODE**: I am simulating a response because the AI API is disabled.\n\nHere is a sample project plan:\n\n1. Use an ESP32.\n2. Connect a DHT22 sensor.\n3. Write code in C++.\n\n(To enable real AI, update your API Key in backend/.env)",
            "timestamp": datetime.utcnow()
        }

    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash-lite-preview-02-05', 
                contents=request.content
            )
            
            ai_content = response.text
            
            return {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": ai_content,
                "timestamp": datetime.utcnow()
            }
        except Exception as e:
            is_rate_limit = "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "Quota exceeded" in str(e)
            
            if is_rate_limit:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"Rate limit hit. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    continue
                else:
                    # FALLBACK TO MOCK MODE AFTER RETRIES FAIL
                    print("⚠️ Quota exhausted. Falling back to Mock Mode.")
                    return {
                        "id": str(uuid.uuid4()),
                        "role": "assistant",
                        "content": "⚠️ **Quota Exceeded**: Google's free tier limit has been reached for your IP/Key.\n\nI am switching to **Offline Mode** so you can continue testing the app layout.\n\n(Please wait a few minutes before trying the real AI again.)",
                        "timestamp": datetime.utcnow()
                    }

            print(f"Gemini Error: {e}")
            return {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": f"⚠️ AI Error: {str(e)}",
                "timestamp": datetime.utcnow()
            }
