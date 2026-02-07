import json
from typing import List, Dict, Any, Optional

class ComponentService:
    def __init__(self):
        pass

    def recommend_components(self, 
                             requirements: str, 
                             context: Optional[Dict[str, Any]], 
                             gemini_client: Any) -> Dict[str, Any]:
        """
        Recommends components based on user requirements and optional circuit context.
        """
        
        system_instructions = """
You are the Nexa Component Agent, an expert in electronic component selection and supply chain management.
Your goal is to suggest the best parts for a given design requirement.

Considerations:
1. Technical specs: Voltage ratings, current capacity, frequency, interface (I2C, SPI, etc.).
2. Availability & Modernity: Prefer parts that are currently in production and widely available.
3. Packaging: Suggest appropriate packages (SMD vs. THT) based on the context.
4. Alternatives: Provide multiple options (Budget vs. High Performance).

Output Format:
You MUST return the result in a structured JSON format:
{
    "recommendations": [
        {
            "id": "Part Identifier (e.g., U1)",
            "name": "Part Number (e.g., LM358)",
            "category": "Category",
            "description": "Brief description of why this was chosen.",
            "specs": {
                "voltage": "Max Voltage",
                "current": "Max Current",
                "interface": "Interface Type",
                "package": "Recommended Package"
            },
            "alternatives": ["Alt Part 1", "Alt Part 2"]
        },
        ...
    ],
    "design_notes": "General advice for the circuit design using these parts."
}
"""

        full_context = ""
        if context:
            full_context = f"\nCircuit Context:\n{json.dumps(context, indent=2)}\n"

        user_prompt = f"Requirements: {requirements}\n{full_context}\nSuggest the necessary components as JSON."

        try:
            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash-lite-preview-02-05',
                contents=[system_instructions, user_prompt],
                config={'response_mime_type': 'application/json'}
            )
            
            return json.loads(response.text)
        except Exception as e:
            return {
                "error": str(e),
                "recommendations": [],
                "design_notes": "Recommendation engine encountered an error."
            }
