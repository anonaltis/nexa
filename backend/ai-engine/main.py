from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import uuid
import os
import json
import asyncio
from google import genai
from dotenv import load_dotenv

# Import AI reasoning components
from circuit_parser.models import CircuitData
from reasoning_engine.engine import ReasoningEngine

load_dotenv()

app = FastAPI(title="Nexa AI Microservice", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GENAI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
client = None
if GENAI_API_KEY and GENAI_API_KEY != "MOCK":
    try:
        client = genai.Client(api_key=GENAI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")

class ChatMessageRequest(BaseModel):
    content: str
    projectId: Optional[str] = None

class AnalyzeTextRequest(BaseModel):
    text: str

class GenerateCodeRequest(BaseModel):
    text: str
    board: Optional[str] = "esp32"

class AskGeminiRequest(BaseModel):
    question: str

@app.get("/health")
def health():
    return {"status": "AI Microservice is running"}

@app.post("/chat/message")
async def chat_message(request: ChatMessageRequest):
    if not client:
        return {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "⚠️ AI API Key is missing or invalid. Testing mode active.",
            "timestamp": datetime.utcnow()
        }
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents=request.content
        )
        return {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": response.text,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-text")
async def analyze_circuit_text(request: AnalyzeTextRequest):
    if not client:
         # Fallback to Mock Data
         mock_data = CircuitData(
             circuit_id="mock",
             description=request.text,
             components=[
                 {"id": "R1", "type": "Resistor", "value": "1k", "nodes": ["Vin", "inv"]},
                 {"id": "Rf", "type": "Resistor", "value": "10k", "nodes": ["inv", "Vout"]},
                 {"id": "U1", "type": "OpAmp", "value": "LM358", "nodes": {"inverting": "inv", "non_inverting": "GND", "output": "Vout"}}
             ],
             supplies=[
                 {"id": "VCC_POS", "type": "DC", "value": "15V", "node": "VCC_POS"},
                 {"id": "VCC_NEG", "type": "DC", "value": "-15V", "node": "VCC_NEG"},
                 {"id": "Vin", "type": "DC", "value": "1V", "node": "Vin"}
             ],
             measured_outputs={"VOUT": "-10V"}
         )
         engine = ReasoningEngine(mock_data)
         return {
             "structured_analysis": engine.generate_report(),
             "circuit_data": mock_data
         }

    prompt = f"""
    Parse the following circuit description into a JSON format matching this schema:
    {{
        "circuit_id": "string",
        "description": "string",
        "components": [{{ "id": "string", "type": "string", "value": "string", "nodes": ["string"] or {{"role": "node"}}}}],
        "supplies": [{{ "id": "string", "type": "string", "value": "string", "node": "string" }}],
        "measured_outputs": {{ "node": "value" }}
    }}
    
    Description: {request.text}
    
    Return ONLY valid JSON.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        
        data_dict = json.loads(response.text)
        data = CircuitData(**data_dict)
        engine = ReasoningEngine(data)
        return {
            "structured_analysis": engine.generate_report(),
            "circuit_data": data_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-code")
async def generate_code(request: GenerateCodeRequest):
    if not client:
        return {"code": "// AI Engine Offline. Showing generic template.\nvoid setup() {} void loop() {}"}

    prompt = f"Generate Arduino C++ code for {request.board} base on: {request.text}. Return ONLY code."
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents=prompt
        )
        return {"code": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask-gemini")
async def ask_gemini(request: AskGeminiRequest):
    if not client:
        return {"ai_response": "AI Service unavailable. Please check API keys."}

    prompt = f"You are a PCB Troubleshooter. User asks: {request.question}. Analyze and suggest steps."
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents=prompt
        )
        return {"ai_response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
