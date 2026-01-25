
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from circuit_parser.models import CircuitData
from reasoning_engine.engine import ReasoningEngine
from api.auth import router as auth_router
from api.projects import router as projects_router
from api.chat import router as chat_router
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
