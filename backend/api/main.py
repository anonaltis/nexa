
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from circuit_parser.models import CircuitData
from reasoning_engine.engine import ReasoningEngine
from api.auth import router as auth_router
from api.projects import router as projects_router
from api.chat import router as chat_router
from api.chat_v2 import router as chat_v2_router
from api.chat_v3 import router as chat_v3_router
from api.chat_history import router as chat_history_router
from api.code import router as code_router
from api.pcb import router as pcb_router
from api.components import router as components_router
from api.schematics import router as schematics_router
from api.design import router as design_router
from api.simulation import router as simulation_router
from api.diagnostics import router as diagnostics_router, AnalyzeTextRequest, analyze_circuit_text
from api.orchestrator import router as orchestrator_router
from api.vision import router as vision_router
from db import db

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
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
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
app.include_router(chat_v2_router, prefix="/v2/chat", tags=["chat-v2"])
app.include_router(chat_v3_router)  # v3 has its own prefix: /api/v3/chat
app.include_router(chat_history_router, prefix="/chat", tags=["chat-history"])
app.include_router(code_router, prefix="/code", tags=["code"])
app.include_router(pcb_router)  # PCB has its own prefix: /api/pcb
app.include_router(components_router, prefix="/components", tags=["components"])
app.include_router(schematics_router)
app.include_router(design_router)  # Design has its own prefix: /api/design
app.include_router(simulation_router)  # Simulation has its own prefix: /api/simulation
app.include_router(diagnostics_router)  # Diagnostics has its own prefix: /api/diagnostics
app.include_router(orchestrator_router)  # Orchestrator: /api/orchestrator
app.include_router(vision_router)  # Vision: /api/vision

@app.post("/analyze-text")
async def top_level_analyze_text(request: AnalyzeTextRequest):
    return await analyze_circuit_text(request)

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
