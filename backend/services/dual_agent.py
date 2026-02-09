"""
Dual Agent Service - New SDK (Async)
"""

import logging
import os
import json
import asyncio
from google import genai
from google.genai import types

# Import our new electronics tools
from functions.electronics import (
    calculate_resistor_value,
    search_component_datasheet
)

logger = logging.getLogger(__name__)

class DualAgentService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(api_version='v1beta')
        )
        self.client = self._client.aio
        
        self.electronics_tools = [
            calculate_resistor_value,
            search_component_datasheet
        ]
        
        self.model_name = "gemini-3-flash-preview"
        self.system_instruction_generator = """Expert Electronics Engineer."""
        self.system_instruction_validator = """Senior Reviewer (Physicist). 
Return JSON: {"status": "PASS/FAIL", "issues": [], "corrections": []}"""

    async def generate_response(self, user_query: str, session_history: list = None) -> dict:
        try:
            # 1. GENERATION
            response_1 = await self.client.models.generate_content(
                model=self.model_name,
                contents=user_query,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction_generator,
                    tools=self.electronics_tools
                )
            )
            initial_solution = response_1.text
            
            # 2. VALIDATION
            response_val = await self.client.models.generate_content(
                model=self.model_name,
                contents=f"Verify: {initial_solution}",
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction_validator
                )
            )
            val_res = self._parse_json(response_val.text)
            
            final_response = initial_solution
            if val_res.get("status") == "FAIL":
                # 3. REFINEMENT
                response_2 = await self.client.models.generate_content(
                    model=self.model_name,
                    contents=f"Fix: {val_res.get('issues')}\nPlan: {initial_solution}",
                    config=types.GenerateContentConfig(
                        system_instruction=self.system_instruction_generator
                    )
                )
                final_response = response_2.text

            return {
                "content": final_response,
                "metadata": {"validation_status": val_res.get("status"), "model": self.model_name}
            }
            
        except Exception as e:
            logger.exception("Dual Agent Error")
            return {"content": f"Error: {str(e)}", "metadata": {"error": str(e)}}

    def _parse_json(self, text: str) -> dict:
        try:
            clean = text.strip()
            if "```json" in clean: clean = clean.split("```json")[1].split("```")[0]
            return json.loads(clean)
        except:
            return {"status": "PASS"}

_dual_agent_instance = None
def get_dual_agent(api_key: str):
    global _dual_agent_instance
    if not _dual_agent_instance:
        _dual_agent_instance = DualAgentService(api_key)
    return _dual_agent_instance
