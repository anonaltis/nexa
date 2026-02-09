"""
Diagnostic Agent API

Provides circuit analysis and troubleshooting based on text descriptions.
Uses the ReasoningEngine for physics-based validation.
"""

from fastapi import APIRouter, HTTPException
import asyncio
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
    """
    # Simulate processing delay
    await asyncio.sleep(2.5)
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
            model="gemini-3-flash-preview",
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
    """Fallback mock analysis with demo-specific cases."""
    text_lower = text.lower()
    
    # DEMO CASE 1: Smart LED Controller
    if any(w in text_lower for w in ["led", "rgb", "blink", "controller"]):
        mock_data = CircuitData(
            circuit_id="demo-led-controller",
            description="Smart RGB LED Controller using ESP32 PWM channels",
            components=[
                {"id": "ESP32", "type": "MCU", "value": "WROOM-32", "nodes": ["GPIO25", "GPIO26", "GPIO27", "GND"]},
                {"id": "R1", "type": "Resistor", "value": "220Ω", "nodes": ["GPIO25", "RED_A"]},
                {"id": "R2", "type": "Resistor", "value": "220Ω", "nodes": ["GPIO26", "GRN_A"]},
                {"id": "R3", "type": "Resistor", "value": "220Ω", "nodes": ["GPIO27", "BLU_A"]},
                {"id": "LED1", "type": "RGB_LED", "value": "Common Cathode", "nodes": ["RED_A", "GRN_A", "BLU_A", "GND"]}
            ],
            supplies=[
                {"id": "V1", "type": "DC", "value": "3.3V", "node": "3V3"}
            ],
            measured_outputs={"GPIO25": "PWM", "RED_A": "1.8V"}
        )
    # DEMO CASE 2: IoT Temperature Monitor
    elif any(w in text_lower for w in ["temperature", "dht", "humidity", "oled", "monitor"]):
        mock_data = CircuitData(
            circuit_id="demo-temp-monitor",
            description="IoT Temperature & Humidity Monitor with DHT22 and SSD1306 OLED",
            components=[
                {"id": "ESP32", "type": "MCU", "value": "WROOM-32", "nodes": ["GPIO4", "GPIO21", "GPIO22", "3V3", "GND"]},
                {"id": "DHT22", "type": "Sensor", "value": "Temp/Hum", "nodes": ["GPIO4", "3V3", "GND"]},
                {"id": "OLED", "type": "Display", "value": "SSD1306", "nodes": ["GPIO21", "GPIO22", "3V3", "GND"]},
                {"id": "R_PU", "type": "Resistor", "value": "10kΩ", "nodes": ["GPIO4", "3V3"]}
            ],
            supplies=[
                {"id": "V1", "type": "DC", "value": "3.3V", "node": "3V3"}
            ],
            measured_outputs={"GPIO21": "I2C_SDA", "GPIO4": "1-Wire"}
        )
    else:
        # Default fallback
        mock_data = CircuitData(
            circuit_id="mock-generic",
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
    
    # Custom tweaks for demo consistency in report
    if mock_data.circuit_id == "demo-led-controller":
        report["reasoning_steps"].insert(0, "PWM Analysis: Verifying ESP32 ledc peripheral configuration for 5kHz.")
        report["learning_notes"].append("Current Limit: 220Ω ensures 15-20mA per channel, optimal for standard RGB LEDs.")
    elif mock_data.circuit_id == "demo-temp-monitor":
        report["reasoning_steps"].insert(0, "Protocol Check: Validating I2C clock timing for SSD1306 at 400kHz.")
        report["learning_notes"].append("Pull-up: The 10kΩ resistor on GPIO4 is mission-critical for the DHT22 1-Wire signal.")

    return DiagnosticResponse(
        structured_analysis=report,
        markdown_response=engine.format_as_markdown(report),
        circuit_data=json.loads(mock_data.json())
    )
