
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from circuit_parser.models import CircuitData
from reasoning_engine.engine import ReasoningEngine
from api.auth import router as auth_router
from api.projects import router as projects_router
from api.chat import router as chat_router
from db import db
from pydantic import BaseModel
from typing import Optional

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    db.connect()
    yield
    # Shutdown: Close DB
    db.close()

app = FastAPI(title="CircuitSathi Backend", version="1.0", lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(projects_router, prefix="/projects", tags=["projects"])
app.include_router(chat_router, prefix="/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CircuitSathi Reasoning Engine"}

@app.post("/analyze")
def analyze_circuit(data: CircuitData):
    try:
        engine = ReasoningEngine(data)
        report = engine.generate_report()
        markdown_report = engine.format_as_markdown(report)
        return {
            "structured_analysis": report,
            "markdown_response": markdown_report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeTextRequest(BaseModel):
    text: str

@app.post("/analyze-text")
async def analyze_circuit_text(request: AnalyzeTextRequest):
    from api.chat import client, GENAI_API_KEY
    import json
    
    if not GENAI_API_KEY:
         # Mock fallback if no API key
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
        report = engine.generate_report()
        
        return {
            "structured_analysis": report,
            "circuit_data": data_dict
        }
    except Exception as e:
        print(f"Error in analyze-text: {e}")
        # Fallback to a simple analysis if Gemini fails or returns bad JSON
        raise HTTPException(status_code=500, detail=f"Failed to parse circuit: {str(e)}")

class GenerateCodeRequest(BaseModel):
    text: str
    board: Optional[str] = "esp32"

@app.post("/generate-code")
async def generate_code(request: GenerateCodeRequest):
    from api.chat import client, GENAI_API_KEY
    
    if not GENAI_API_KEY:
         return {
            "code": "// Gemini API Key missing. Showing demo code.\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  Serial.println(\"Hello from Nexa!\");\n  delay(1000);\n}"
        }

    prompt = f"""
    Generate professional Arduino/C++ code for an {request.board} project based on this description:
    {request.text}
    
    Include:
    - Proper pin definitions
    - Necessary libraries
    - Comments explaining the logic
    - setup() and loop() functions
    
    Return ONLY the code, no markdown wrappers like ```cpp.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents=prompt
        )
        return {"code": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AskGeminiRequest(BaseModel):
    question: str

@app.post("/ask-gemini")
async def ask_gemini(request: AskGeminiRequest):
    from api.chat import client, GENAI_API_KEY
    
    if not client:
         return {
            "ai_response": "I am an AI assistant specialized in PCB troubleshooting. Please provide an API key to enable my full reasoning capabilities."
        }

    prompt = f"""
    You are an expert PCB Troubleshooting Assistant. 
    Analyze the following issue and provide a technical explanation, potential causes, and specific steps to fix it.
    
    User Question: {request.question}
    
    Response Format:
    - 🔍 Analysis: ...
    - 🛠 Potential Causes: ...
    - ✅ Solution Steps: ...
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05', 
            contents=prompt
        )
        return {"ai_response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
