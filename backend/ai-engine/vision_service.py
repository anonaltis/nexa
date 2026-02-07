import base64
import json
from typing import Dict, Any, Optional

class VisionService:
    def __init__(self):
        pass

    def analyze_circuit_image(self, 
                             image_data_base64: str, 
                             prompt_type: str, 
                             gemini_client: Any) -> Dict[str, Any]:
        """
        Analyzes a PCB or Schematic image using Gemini Vision.
        prompt_type: 'pcb' or 'schematic'
        """
        
        system_instructions = """
You are an expert Electronics Engineer and Computer Vision specialist.
Your task is to analyze the provided image (which is either a PCB layout or a circuit schematic) and extract structured information about the circuit.

Extraction Goals:
1. Component Detection: Identify all electronic components (Resistors, Capacitors, ICs, Transistors, etc.).
2. Topology Extraction: Infer the connections between components (Netlist).
3. Values: If labels are visible (e.g., '10k', '1uF', 'U1'), extract them.

Output Format:
You MUST return the result in a structured JSON format matching the following schema:
{
    "components": [
        {"id": "REF_DES", "type": "TYPE", "value": "VALUE", "nodes": ["NODE1", "NODE2"]},
        ...
    ],
    "supplies": [
        {"id": "SUPPLY_ID", "type": "DC/AC", "value": "VALUE", "node": "NODE"},
        ...
    ],
    "topology_summary": "High-level description of what the circuit does."
}

Special Instructions:
- If a component has multiple pins (like an IC), use a dictionary for 'nodes', e.g., {"pin1": "GND", "pin2": "VCC"}.
- Use meaningful node names if possible (e.g., 'GND', 'VCC', 'V_OUT').
- If the image is a PCB, try to identify the package types (e.g., '0805', 'SOT-23').
"""

        user_prompt = f"Analyze this {prompt_type} image and extract the circuit data as JSON."

        try:
            # Prepare the image for Gemini
            image_blob = {
                'mime_type': 'image/jpeg', # Assuming JPEG, though base64 could be anything
                'data': image_data_base64
            }

            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash-lite-preview-02-05',
                contents=[system_instructions, user_prompt, image_blob],
                config={'response_mime_type': 'application/json'}
            )
            
            return json.loads(response.text)
        except Exception as e:
            return {
                "error": str(e),
                "components": [],
                "supplies": [],
                "topology_summary": "Analysis failed."
            }
