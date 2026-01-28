"""
Gemini Function Calling Integration

This module integrates Gemini with the function calling system.
It handles the full conversation loop:

1. User message → Gemini (with function declarations)
2. Gemini responds with either:
   a) Direct text response
   b) Function call request
3. If function call:
   - Execute function via FunctionExecutor
   - Send result back to Gemini
   - Gemini generates final response
4. Return structured response to user

NO MCP. Classic Gemini function calling only.
"""

import json
import logging
from typing import Any
from dataclasses import dataclass
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

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
    Gemini integration with function calling support.

    This class manages the conversation loop when functions are involved.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash-lite"):
        """Initialize Gemini with function calling capability."""
        genai.configure(api_key=api_key)

        # Convert our function declarations to Gemini format
        self._tools = self._create_tools()

        # Create model with tools
        self._model = genai.GenerativeModel(
            model_name=model_name,
            tools=self._tools
        )

        self._chat_sessions: dict[str, Any] = {}

    def _create_tools(self) -> list[Tool]:
        """Convert function declarations to Gemini Tool format."""
        function_declarations = []

        for decl in FUNCTION_DECLARATIONS:
            fd = FunctionDeclaration(
                name=decl["name"],
                description=decl["description"],
                parameters=decl["parameters"]
            )
            function_declarations.append(fd)

        return [Tool(function_declarations=function_declarations)]

    def _create_tools_for_mode(self, mode: str) -> list[Tool]:
        """Create tools for a specific mode (debug, planning, learning)."""
        declarations = get_declarations_for_mode(mode)
        function_declarations = []

        for decl in declarations:
            fd = FunctionDeclaration(
                name=decl["name"],
                description=decl["description"],
                parameters=decl["parameters"]
            )
            function_declarations.append(fd)

        return [Tool(function_declarations=function_declarations)]

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
        Send message to Gemini with function calling support.

        Args:
            message: User's message
            session_id: Session identifier for maintaining context
            system_prompt: System prompt defining AI behavior
            mode: Function mode (debug, planning, learning, all)
            user_context: User profile information for personalization
            conversation_history: Previous messages for context

        Returns:
            GeminiFunctionResponse with text and/or function results
        """
        reasoning_chain = []
        function_call_info = None
        function_result = None
        final_response = None

        try:
            # Get or create chat session
            if session_id not in self._chat_sessions:
                # Create model with mode-specific tools
                tools = self._create_tools_for_mode(mode) if mode != "all" else self._tools

                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash-lite",
                    tools=tools,
                    system_instruction=system_prompt
                )

                # Initialize chat with history if provided
                history = []
                if conversation_history:
                    for msg in conversation_history[-10:]:  # Last 10 messages
                        role = "user" if msg.get("role") == "user" else "model"
                        history.append({
                            "role": role,
                            "parts": [msg.get("content", "")]
                        })

                self._chat_sessions[session_id] = model.start_chat(history=history)

            chat = self._chat_sessions[session_id]

            # Add user context to message if available
            enhanced_message = message
            if user_context:
                context_str = f"\n[User Context: Skill level: {user_context.get('skill_level', 'beginner')}, "
                if user_context.get('common_mistakes'):
                    context_str += f"Previous mistakes: {', '.join(user_context['common_mistakes'][:3])}"
                context_str += "]"
                enhanced_message = message + context_str

            reasoning_chain.append(f"Processing user message: {message[:100]}...")

            # Send message to Gemini
            response = chat.send_message(enhanced_message)

            # Check if Gemini wants to call a function
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    # Check for function call
                    if hasattr(part, 'function_call') and part.function_call:
                        fc = part.function_call
                        function_name = fc.name
                        function_args = dict(fc.args) if fc.args else {}

                        reasoning_chain.append(f"Gemini requested function: {function_name}")
                        reasoning_chain.append(f"Arguments: {json.dumps(function_args, indent=2)}")

                        function_call_info = {
                            "name": function_name,
                            "arguments": function_args
                        }

                        # Execute the function
                        logger.info(f"Executing function: {function_name}")
                        function_result = await execute_function(function_name, function_args)

                        reasoning_chain.append(f"Function executed successfully")
                        reasoning_chain.append(f"Result keys: {list(function_result.keys())}")

                        # Send function result back to Gemini
                        from google.generativeai.types import content_types
                        function_response = content_types.to_content({
                            "function_response": {
                                "name": function_name,
                                "response": function_result
                            }
                        })

                        # Get final response from Gemini
                        final_response_obj = chat.send_message(function_response)

                        if final_response_obj.candidates:
                            final_response = final_response_obj.text
                            reasoning_chain.append("Gemini generated final response")

                        break

                    # Check for text response
                    elif hasattr(part, 'text') and part.text:
                        if not final_response:
                            final_response = part.text
                            reasoning_chain.append("Gemini returned direct text response")

            # Determine confidence based on whether function was called
            if function_result:
                # Higher confidence when backed by function validation
                if function_result.get("is_valid") is True:
                    confidence = "high"
                elif function_result.get("is_valid") is False:
                    confidence = "medium"  # Validation caught an issue
                else:
                    confidence = "medium"
            else:
                confidence = "medium"  # Direct text response without validation

            return GeminiFunctionResponse(
                text=response.text if not function_call_info else None,
                function_call=function_call_info,
                function_result=function_result,
                final_response=final_response or response.text,
                reasoning_chain=reasoning_chain,
                confidence=confidence,
                metadata={
                    "mode": mode,
                    "function_called": function_call_info["name"] if function_call_info else None,
                    "session_id": session_id
                }
            )

        except Exception as e:
            logger.exception(f"Error in Gemini chat: {e}")
            reasoning_chain.append(f"Error occurred: {str(e)}")

            return GeminiFunctionResponse(
                text=None,
                function_call=None,
                function_result=None,
                final_response=f"I encountered an error processing your request. Please try again. Error: {str(e)}",
                reasoning_chain=reasoning_chain,
                confidence="low",
                metadata={"error": str(e)}
            )

    def clear_session(self, session_id: str):
        """Clear a chat session."""
        if session_id in self._chat_sessions:
            del self._chat_sessions[session_id]

    async def analyze_with_validation(
        self,
        circuit_description: str,
        session_id: str,
        system_prompt: str,
        user_context: dict | None = None
    ) -> dict[str, Any]:
        """
        Analyze a circuit with automatic validation.

        This is a convenience method that:
        1. Sends the circuit description to Gemini
        2. Expects Gemini to call analyze_circuit and validate_circuit_solution
        3. Returns a comprehensive result with verification status
        """
        # Enhanced prompt to encourage function calling
        enhanced_prompt = f"""Analyze this circuit issue and provide a verified solution.

User's circuit description:
{circuit_description}

IMPORTANT:
1. Call analyze_circuit to perform detailed analysis
2. If proposing a solution, call validate_circuit_solution to verify it
3. Include physics calculations and validation status in your response
4. Format response with clear sections: Analysis, Root Cause, Solution, Verification"""

        response = await self.chat(
            message=enhanced_prompt,
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
            "confidence": response.confidence,
            "verified": response.function_result.get("is_valid") if response.function_result else None
        }


# Factory function
_gemini_fc_instance: GeminiFunctionCalling | None = None


def get_gemini_function_calling(api_key: str) -> GeminiFunctionCalling:
    """Get or create the Gemini function calling instance."""
    global _gemini_fc_instance
    if _gemini_fc_instance is None:
        _gemini_fc_instance = GeminiFunctionCalling(api_key)
    return _gemini_fc_instance
