
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import uuid
import asyncio
import traceback
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
    sessionId: Optional[str] = None  # Optional session ID for persistence
    useReasoning: Optional[bool] = False # Toggle for Dual Agent mode

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
# Configure Gemini
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = None

if GENAI_API_KEY == "MOCK":
    print("Gemini API Key is MOCK. Using Mock Mode.")
    client = None
elif GENAI_API_KEY:
    try:
        client = genai.Client(api_key=GENAI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini client with GEMINI_API_KEY: {e}")
elif GOOGLE_API_KEY:
     try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
     except Exception as e:
        print(f"Failed to initialize Gemini client with GOOGLE_API_KEY: {e}")
else:
    print("No API Key found. Using Mock Mode.")

# --- Configuration ---
MODEL_NAME = "gemini-2.5-flash-lite" 

if GENAI_API_KEY:
    try:
        # Version specify karne se 404 ke chances kam ho jate hain
        client = genai.Client(api_key=GENAI_API_KEY, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Failed to initialize: {e}")


from db import db
from bson import ObjectId
from services.dual_agent import get_dual_agent

async def save_message_to_session(session_id: str, user_id: str, message: dict):
    """Helper to save a message to a chat session"""
    if not session_id:
        return
    try:
        await db.db["chat_sessions"].update_one(
            {"_id": ObjectId(session_id), "user_id": user_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    except Exception as e:
        print(f"Failed to save message to session: {e}")

@router.post("/message", response_model=ChatMessageResponse)
async def chat_message(request: ChatMessageRequest, current_user: str = Depends(get_current_user)):

    # Save user message to session if sessionId provided
    if request.sessionId:
        user_msg = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": request.content,
            "timestamp": datetime.utcnow(),
            "metadata": None
        }
        await save_message_to_session(request.sessionId, current_user, user_msg)

    if not client:
        import random
        mock_resp = random.choice(MOCK_RESPONSES)

        response_data = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": mock_resp["content"],
            "timestamp": datetime.utcnow(),
            "metadata": mock_resp.get("poll")
        }

        # Save assistant response to session
        if request.sessionId:
            await save_message_to_session(request.sessionId, current_user, response_data)

        return response_data

    max_retries = 3
    base_delay = 5

    for attempt in range(max_retries):
        try:
            response_text = ""
            metadata = None
            
            if request.useReasoning and GENAI_API_KEY and GENAI_API_KEY != "MOCK":
                 # Use Dual Agent Service
                dual_agent = get_dual_agent(GENAI_API_KEY)
                result = await dual_agent.generate_response(request.content)
                response_text = result["content"]
                metadata = result["metadata"]
            else:
                # Standard Chat using Client
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=request.content
                )
                response_text = response.text

            response_data = {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.utcnow(),
                "metadata": metadata
            }

            # Save assistant response to session
            if request.sessionId:
                await save_message_to_session(request.sessionId, current_user, response_data)

            return response_data

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                if attempt < max_retries - 1:
                    delay = base_delay * (attempt + 1)
                    print(f"Quota hit! Attempt {attempt+1} failed. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    continue
                else:
                    response_data = {
                        "id": str(uuid.uuid4()),
                        "role": "assistant",
                        "content": "API quota exceeded. Please try again in a minute.",
                        "timestamp": datetime.utcnow()
                    }
                    if request.sessionId:
                        await save_message_to_session(request.sessionId, current_user, response_data)
                    return response_data

            print(f"Error in chat_message: {str(e)}")
            traceback.print_exc()

            import random
            mock_resp = random.choice(MOCK_RESPONSES)

            response_data = {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": mock_resp["content"] + f"\n\n(Note: Showing demo response due to API Error: {error_msg})",
                "timestamp": datetime.utcnow(),
                "metadata": mock_resp.get("poll")
            }

            if request.sessionId:
                await save_message_to_session(request.sessionId, current_user, response_data)

            return response_data