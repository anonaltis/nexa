from fastapi import FastAPI, HTTPException
from ..circuit_parser.models import CircuitData
from ..reasoning_engine.engine import ReasoningEngine

app = FastAPI(title="CircuitSathi Backend", version="1.0")

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
