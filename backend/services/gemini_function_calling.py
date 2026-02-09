"""
Gemini Function Calling Integration (New SDK - Async)

This module integrates Gemini with the function calling system using the async google-genai SDK.
"""

import json
import logging
from typing import Any
from dataclasses import dataclass
from google import genai
from google.genai import types

from functions.declarations import (
    FUNCTION_DECLARATIONS,
    get_declarations_for_mode
)
from services.function_executor import execute_function

logger = logging.getLogger(__name__)


@dataclass
class GeminiFunctionResponse:
    """Response from Gemini with function calling."""
    text: str | None
    function_call: dict | None
    function_result: dict | None
    final_response: str | None
    reasoning_chain: list[str]
    confidence: str
    metadata: dict


class GeminiFunctionCalling:
    """
    Gemini integration with function calling support using new google-genai SDK (Async).
    """

    def __init__(self, api_key: str, model_name: str = "gemini-3-flash-preview"):
        """Initialize Gemini Client."""
        self.api_key = api_key
        self.model_name = model_name
        # Use v1beta which supports system_instruction and tools for 2.0-flash
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(api_version='v1beta')
        )
        # We use the aio property for async calls
        self.client = self._client.aio
        self._chat_sessions = {}

    def _wrap_declarations(self, declarations: list[dict]) -> list[types.Tool]:
        """Wrap JSON declarations into SDK Tool objects."""
        if not declarations:
            return []
            
        function_declarations = []
        for decl in declarations:
            fd = types.FunctionDeclaration(
                name=decl["name"],
                description=decl["description"],
                parameters=types.Schema(**decl["parameters"]) if decl.get("parameters") else None
            )
            function_declarations.append(fd)
        
        return [types.Tool(function_declarations=function_declarations)]

    def _get_tools_for_mode(self, mode: str) -> list[types.Tool]:
        """Get tools wrapped for the new SDK."""
        declarations = FUNCTION_DECLARATIONS if mode == "all" else get_declarations_for_mode(mode)
        return self._wrap_declarations(declarations)

    async def chat(
        self,
        message: str,
        session_id: str,
        system_prompt: str,
        mode: str = "all",
        user_context: dict | None = None,
        conversation_history: list[dict] | None = None
    ) -> GeminiFunctionResponse:
        """
        Send message to Gemini with function calling support (New SDK - Async).
        """
        reasoning_chain = []
        function_call_info = None
        function_result = None
        final_response = None
        confidence = "medium"

        try:
            tools = self._get_tools_for_mode(mode)
            
            enhanced_message = message
            if user_context:
                enhanced_message += f"\n[Context: Skill={user_context.get('skill_level')}]"

            reasoning_chain.append(f"📡 Requesting {self.model_name}...")

            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=tools
            )

            # 1. Initial Call (Async)
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=enhanced_message,
                config=config
            )

            # 2. Check for function call
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.function_call:
                        fc = part.function_call
                        function_name = fc.name
                        function_args = fc.args
                        
                        reasoning_chain.append(f"🛠️ Tool call: {function_name}")
                        function_call_info = {"name": function_name, "arguments": function_args}
                        
                        # Execute the function
                        function_result = await execute_function(function_name, function_args)
                        reasoning_chain.append(f"✅ Executed: {function_name}")
                        
                        # 3. Send back the function result
                        response = await self.client.models.generate_content(
                            model=self.model_name,
                            contents=[
                                types.Content(role='user', parts=[types.Part.from_text(text=enhanced_message)]),
                                response.candidates[0].content, 
                                types.Content(role='tool', parts=[
                                    types.Part.from_function_response(
                                        name=function_name,
                                        response=function_result
                                    )
                                ])
                            ],
                            config=config
                        )
                        final_response = response.text
                        confidence = "high"
                        break
                
                if not final_response:
                    final_response = response.text
                    reasoning_chain.append("💬 Final response received")

            return GeminiFunctionResponse(
                text=final_response,
                function_call=function_call_info,
                function_result=function_result,
                final_response=final_response or "No response.",
                reasoning_chain=reasoning_chain,
                confidence=confidence,
                metadata={"mode": mode, "model": self.model_name}
            )

        except Exception as e:
            logger.exception(f"Gemini Error: {e}")
            return GeminiFunctionResponse(
                text=None,
                function_call=None,
                function_result=None,
                final_response=f"Error: {str(e)}",
                reasoning_chain=reasoning_chain,
                confidence="low",
                metadata={"error": str(e)}
            )

    async def analyze_with_validation(self, circuit_description, session_id, system_prompt, user_context=None):
        """Analyze circuit with mandatory validation."""
        response = await self.chat(
            message=f"Analyze and verify: {circuit_description}",
            session_id=session_id,
            system_prompt=system_prompt,
            mode="debug",
            user_context=user_context
        )
        return {
            "response": response.final_response,
            "function_called": response.function_call,
            "function_result": response.function_result,
            "reasoning_chain": response.reasoning_chain,
            "confidence": response.confidence
        }


# Singleton instance
_gemini_fc_instance: GeminiFunctionCalling | None = None


def get_gemini_function_calling(api_key: str) -> GeminiFunctionCalling:
    """Get or create the Gemini function calling instance."""
    global _gemini_fc_instance
    if _gemini_fc_instance is None:
        _gemini_fc_instance = GeminiFunctionCalling(api_key)
    return _gemini_fc_instance
