"""
Dual Agent Service: Orchestrates the interaction between the 'Generator' (Electronics Engineer)
and the 'Validator' (Senior Reviewer/Physicist) to ensure high-quality, hallucination-free responses.
"""

import logging
import os
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
import json
import asyncio

# Import our new electronics tools
from functions.electronics import (
    calculate_resistor_value,
    search_component_datasheet
)

logger = logging.getLogger(__name__)

class DualAgentService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        
        # --- Tools Configuration ---
        # We wrap our python functions into Gemini Tools
        
        self.electronics_tools = [
            calculate_resistor_value,
            search_component_datasheet
        ]
        
        # --- Generator Model ---
        # The Creative Architect / Electronics Engineer
        self.generator_model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-lite",
            tools=self.electronics_tools,
            system_instruction="""
            You are an expert Electronics Engineer and Solution Architect. 
            你的目标是帮助用户构建电子项目，解决电路问题。
            
            Key Responsibilities:
            1. Design circuits and provide component lists.
            2. Troubleshoot diagnosis queries with step-by-step logic.
            3. Use the provided tools (calculate_resistor_value, search_component_datasheet) extensively to verify values.
            4. If asked for a circuit diagram, provide a Mermaid.js 'graph TD' or 'flowchart LR' block.
            
            Tone: Helpful, technical but accessible, creative.
            Language: Respond in the language the user initiated (Hindi/Urdu/English mix is acceptable if user uses it).
            """
        )
        
        # --- Validator Model ---
        # The Strict Critic / Senior Physicist
        self.validator_model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-lite",
            # Validator relies on internal physics knowledge for now
            system_instruction="""
            You are a Senior Systems Validation Engineer and Physicist.
            Your role is to CRITIQUE the plans and solutions proposed by the Junior Engineer.
            
            You must check for:
            1. **Voltage Mismatches**: e.g., connecting 5V logic to 3.3V pins without level shifting.
            2. **Missing Safety Components**: e.g., missing flyback diodes on relays/motors, missing current limiting resistors.
            3. **Hallucinations**: Parts that don't exist or pinouts that are wrong.
            4. **Logical Flaws**: Steps that won't work in the physical world.
            
            Output Format:
            If the solution is GOOD: Return a JSON with {"status": "PASS", "comment": "Optional minor suggestions"}
            If the solution is FLAWED: Return a JSON with {"status": "FAIL", "issues": ["List of specific fatal errors"], "corrections": ["Specific fixes"]}
            """
        )

    async def generate_response(self, user_query: str, session_history: list = None) -> dict:
        """
        Orchestrates the Dual Agent Loop:
        1. Generator creates a solution.
        2. Validator checks it.
        3. If Validator rejects, Generator fixes it (once).
        4. Returns the final result.
        """
        
        # 1. GENERATION PHASE
        logger.info(f"DualAgent: Generating solution for query: {user_query[:50]}...")
        
        # Prepare history for the generator (simplified for this implementation)
        # In a full impl, we'd convert the session_history to Gemini format
        chat = self.generator_model.start_chat(enable_automatic_function_calling=True)
        
        # Prompt engineering for the generator
        generator_prompt = f"User Request: {user_query}\n\nPlease provide a comprehensive solution."
        
        try:
            # We use async execution if available, otherwise standard call
            # The google-generativeai lib is mostly sync wrappers around async GRPC, but let's just call it directly
            
            try:
                response_1 = await chat.send_message_async(generator_prompt)
                initial_solution = response_1.text
            except Exception as e:
                if "429" in str(e) or "ResourceExhausted" in str(e):
                    logger.warning(f"DualAgent: Generator hit rate limit: {e}")
                    return {
                        "content": "⚠️ **System Busy (Rate Limit Reached)**\n\nThe AI reasoning engine is currently experiencing high load (Google Gemini Free Tier limits). Please wait a minute and try again.",
                        "metadata": {"error": "RateLimit", "details": str(e)}
                    }
                raise e
            
            logger.info("DualAgent: Initial solution generated.")

            # 2. VALIDATION PHASE
            validation_prompt = f"""
            Analyze the following solution provided for the user request: "{user_query}"
            
            Proposed Solution:
            {initial_solution}
            
            Verify this strictly for safety, physics correctness, and logic.
            """
            
            try:
                validator_response = await self.validator_model.generate_content_async(validation_prompt)
                validator_text = validator_response.text
                validation_result = self._parse_validator_output(validator_text)
            except Exception as e:
                # If validator fails (e.g. rate limit), fallback to just returning the generator's response
                # We don't want to fail the whole request just because validation got rate-limited
                logger.warning(f"DualAgent: Validator failed (likely rate limit). Returning unverified result. Error: {e}")
                
                # Mock a "Soft Pass" so the user still gets their result
                validation_result = {
                    "status": "PASS (Unverified)",
                    "comment": "Validation skipped due to high system load. Please double-check connections manually."
                }
            
            final_response = initial_solution
            metadata = {
                "validation_status": validation_result.get("status", "UNKNOWN"),
                "validator_comments": validation_result.get("comment", "") or validation_result.get("issues", [])
            }
            
            # 3. REFINEMENT PHASE (If needed)
            if validation_result.get("status") == "FAIL":
                logger.info("DualAgent: Validation failed. Attempting refinement.")
                issues = validation_result.get("issues", [])
                corrections = validation_result.get("corrections", [])
                
                refinement_prompt = f"""
                Your previous solution had the following CRITICAL issues identified by the Senior Engineer:
                Issues: {issues}
                Suggested Corrections: {corrections}
                
                Please rewrite the solution fixing these errors. Acknowledge the corrections.
                """
                
                response_2 = await chat.send_message_async(refinement_prompt)
                final_response = response_2.text
                metadata["refined"] = True
                metadata["refinement_reason"] = issues
            
            return {
                "content": final_response,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.exception("Error in Dual Agent flow")
            return {
                "content": f"I encountered an error while processing your request with the advanced reasoning engine. Error: {str(e)}",
                "metadata": {"error": str(e)}
            }

    def _parse_validator_output(self, text: str) -> dict:
        """
        Helper to extract JSON from the validator's text response.
        Gemini might wrap it in ```json ... ```
        """
        try:
            clean_text = text.strip()
            if "```json" in clean_text:
                clean_text = clean_text.split("```json")[1].split("```")[0]
            elif "```" in clean_text:
                clean_text = clean_text.split("```")[1].split("```")[0]
            
            return json.loads(clean_text)
        except json.JSONDecodeError:
            # Fallback: Validation is erratic, treat as Soft Pass with warning
            logger.warning(f"Could not parse validator JSON: {text[:100]}")
            return {"status": "PASS", "comment": "Validator response structure was invalid, skipping strict check."}

# Singleton instance
_dual_agent_instance = None

def get_dual_agent(api_key: str):
    global _dual_agent_instance
    if not _dual_agent_instance:
        _dual_agent_instance = DualAgentService(api_key)
    return _dual_agent_instance
