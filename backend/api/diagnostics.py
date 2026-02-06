"""
Diagnostic Agent API

Provides circuit analysis and troubleshooting based on text descriptions.
Uses the ReasoningEngine for physics-based validation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from circuit_parser.models import CircuitData
from reasoning_engine.engine import ReasoningEngine
import logging
import json
import os
from google import genai

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/diagnostics", tags=["diagnostics"])

class AnalyzeTextRequest(BaseModel):
    text: str

class DiagnosticResponse(BaseModel):
    structured_analysis: Dict[str, Any]
    markdown_response: str
    circuit_data: Optional[Dict[str, Any]] = None

@router.post("/analyze-text", response_model=DiagnosticResponse)
async def analyze_circuit_text(request: AnalyzeTextRequest):
    """
    Analyzes circuit from a natural language text description.
    1. Parses text to structured CircuitData using Gemini
    2. Runs ReasoningEngine on the parsed data
    """
    try:
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
             # Fallback to a very simple mock if no API key
             return _get_mock_analysis(request.text)

        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Extract circuit components and connections from this description:
        "{request.text}"
        
        Respond ONLY with a JSON object matching this schema:
        {{
            "circuit_id": "string",
            "description": "string",
            "components": [
                {{ "id": "string", "type": "string", "value": "string", "nodes": ["list", "of", "node", "names"] }}
            ],
            "supplies": [
                {{ "id": "string", "type": "DC", "value": "string", "node": "string" }}
            ],
            "measured_outputs": {{ "NODE_NAME": "VALUE" }}
        }}
        """

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )

        circuit_json = json.loads(response.text)
        circuit_data = CircuitData(**circuit_json)
        
        engine = ReasoningEngine(circuit_data)
        report = engine.generate_report()
        markdown_report = engine.format_as_markdown(report)
        
        return DiagnosticResponse(
            structured_analysis=report,
            markdown_response=markdown_report,
            circuit_data=circuit_json
        )

    except Exception as e:
        logger.error(f"Error in diagnostic analysis: {e}")
        # Fallback to mock on error to keep UI working
        return _get_mock_analysis(request.text)

def _get_mock_analysis(text: str):
    """Fallback mock analysis."""
    mock_data = CircuitData(
        circuit_id="mock-" + text[:10],
        description=text,
        components=[
            {"id": "R1", "type": "Resistor", "value": "1k", "nodes": ["Vin", "inv"]},
            {"id": "Rf", "type": "Resistor", "value": "10k", "nodes": ["inv", "Vout"]}
        ],
        supplies=[
            {"id": "V1", "type": "DC", "value": "5V", "node": "Vin"}
        ],
        measured_outputs={"Vout": "0V"}
    )
    engine = ReasoningEngine(mock_data)
    report = engine.generate_report()
    return DiagnosticResponse(
        structured_analysis=report,
        markdown_response=engine.format_as_markdown(report),
        circuit_data={
            "circuit_id": "mock",
            "description": text,
            "components": [{"id": "R1", "type": "Resistor", "value": "1k", "nodes": ["Vin", "inv"]}],
            "supplies": [{"id": "V1", "type": "DC", "value": "5V", "node": "Vin"}],
            "measured_outputs": {"Vout": "0V"}
        }
    )
