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
from spice_service import SpiceService
from firmware_service import FirmwareService

load_dotenv()

app = FastAPI(title="Nexa AI Microservice", version="1.0")
spice_service = SpiceService()
firmware_service = FirmwareService()

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
    circuit_data: Optional[Dict[str, Any]] = None

class AgentChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]
    current_code: str
    board: Optional[str] = "esp32"

class AskGeminiRequest(BaseModel):
    question: str

class SimulateRequest(BaseModel):
    description: Optional[str] = None
    netlist: Optional[str] = None

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
    
    system_prompt = """
    You are Nexa AI, a professional electronics project assistant. 
    Your goal is to help users plan, design, and build electronics projects.
    
    If the user describes a project they want to build, help them define:
    1. Project name and goal
    2. Required components
    3. Basic circuit connection logic
    
    When you feel you have enough information to form a solid initial plan, include a JSON block in your response with the following structure:
    ---PLAN_COMPLETE---
    {
        "isPlanComplete": true,
        "plan": {
            "name": "Project Name",
            "description": "Brief description",
            "category": "one of: iot, robotics, audio, power, communication, sensor, display, other",
            "tags": ["tag1", "tag2"],
            "components": [{"name": "Comp1", "quantity": 1, "purpose": "..."}],
            "connections": [{"from": "Pin A", "to": "Pin B", "description": "..."}]
        }
    }
    ---END_PLAN---
    
    Provide helpful, expert advice in plain markdown text first.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents=[system_prompt, request.content]
        )
        
        text = response.text
        metadata = {}
        
        # Simple parser for the metadata block
        if "---PLAN_COMPLETE---" in text:
            try:
                parts = text.split("---PLAN_COMPLETE---")
                rest = parts[1].split("---END_PLAN---")
                json_str = rest[0].strip()
                metadata = json.loads(json_str)
                # Clean up the text of the message
                text = parts[0] + (rest[1] if len(rest) > 1 else "")
            except Exception as e:
                print(f"Failed to parse metadata: {e}")

        return {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": text.strip(),
            "metadata": metadata,
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

    code = firmware_service.generate_firmware(
        request.text, 
        request.circuit_data, 
        request.board, 
        client
    )
    return {"code": code}

@app.post("/code-agent/chat")
async def code_agent_chat(request: AgentChatRequest):
    if not client:
        return {"response": "AI Service unavailable.", "suggested_code": None}

    result = firmware_service.chat_with_agent(
        request.message,
        request.history,
        request.current_code,
        request.board,
        client
    )
    return result

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

@app.post("/simulate")
async def simulate_circuit(request: SimulateRequest):
    netlist = request.netlist
    
    # If no netlist but description provided, generate netlist using Gemini
    if not netlist and request.description:
        netlist = spice_service.generate_netlist_from_description(request.description, client)
    
    if not netlist:
        raise HTTPException(status_code=400, detail="Either netlist or description must be provided.")
    
    result = spice_service.run_simulation(netlist)
    
    # Add AI analysis if requested and simulation was successful
    if result.get("success") and (request.description or netlist):
        analysis = spice_service.analyze_results(
            result.get("raw_output", ""), 
            request.description or "the circuit", 
            client
        )
        result["ai_analysis"] = analysis
        
    return {
        "netlist": netlist,
        "result": result
    }
