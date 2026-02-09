"""
Chat API v3 - Function Calling Enabled

This is the production-ready chat API with:
- Gemini function calling integration
- Physics validation
- Knowledge base retrieval
- Adaptive learning tracking
- Reasoning transparency

Endpoints:
- POST /api/v3/chat/message - Main chat endpoint
- POST /api/v3/chat/analyze - Circuit analysis with validation
- POST /api/v3/chat/learn - Learning content generation
- GET /api/v3/chat/profile/{user_id} - Get user learning profile
"""

import os
import logging
from typing import Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from services.gemini_function_calling import (
    GeminiFunctionCalling,
    get_gemini_function_calling
)
from services.function_executor import execute_function
from prompts.system_prompts import (
    ELECTRONICS_INSTRUCTOR_PROMPT,
    CIRCUIT_DEBUG_PROMPT,
    PROJECT_PLANNING_PROMPT
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v3/chat", tags=["chat-v3"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class ChatMessage(BaseModel):
    """Chat message request."""
    message: str = Field(..., description="User's message")
    session_id: str = Field(..., description="Session identifier")
    user_id: str = Field(default="anonymous", description="User identifier for personalization")
    mode: str = Field(default="auto", description="Chat mode: auto, debug, planning, learning")
    context: dict = Field(default_factory=dict, description="Additional context")


class ChatResponse(BaseModel):
    """Chat response with transparency."""
    response: str = Field(..., description="AI response text")
    function_called: str | None = Field(None, description="Function that was called, if any")
    function_result: dict | None = Field(None, description="Result from function call")
    reasoning_steps: list[str] = Field(default_factory=list, description="Reasoning chain for transparency")
    confidence: str = Field(default="medium", description="Confidence level: low, medium, high")
    verified_by: list[str] = Field(default_factory=list, description="Physics laws used for verification")
    warnings: list[str] = Field(default_factory=list, description="Any warnings or safety notes")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")


class CircuitAnalysisRequest(BaseModel):
    """Request for circuit analysis."""
    description: str = Field(..., description="Circuit description or issue")
    components: list[str] = Field(default_factory=list, description="List of components")
    supply_voltage: float = Field(default=5.0, description="Supply voltage")
    session_id: str = Field(..., description="Session identifier")
    user_id: str = Field(default="anonymous")


class CircuitAnalysisResponse(BaseModel):
    """Structured circuit analysis response."""
    summary: str
    root_cause: str | None
    physics_analysis: dict
    solution_steps: list[str]
    validation_status: str
    verified_by: list[str]
    warnings: list[str]
    learning_tip: str | None
    confidence: str


class LearningRequest(BaseModel):
    """Request for learning content."""
    topic: str = Field(..., description="Topic to learn about")
    format: str = Field(default="viva_questions", description="Content format")
    skill_level: str = Field(default="beginner")
    user_id: str = Field(default="anonymous")


class UserProfileResponse(BaseModel):
    """User learning profile response."""
    user_id: str
    skill_level: str
    topics_explored: dict
    common_mistakes: list[str]
    strengths: list[str]
    recommended_difficulty: str


class DatasheetRequest(BaseModel):
    """Request for datasheet information."""
    component: str = Field(..., description="Component name or part number")
    info_type: str = Field(default="all", description="Type of info: all, pinout, max_ratings, electrical_characteristics, typical_application")


class CalculateRequest(BaseModel):
    """Request for component calculation."""
    calculation_type: str = Field(..., description="Type of calculation")
    inputs: dict = Field(..., description="Input values for calculation")


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatMessage,
    background_tasks: BackgroundTasks
) -> ChatResponse:
    """
    Main chat endpoint with function calling support.

    Flow:
    1. Detect message intent and select appropriate mode
    2. Send to Gemini with function declarations
    3. If Gemini calls a function:
       - Execute function
       - Send result back to Gemini
       - Get final response
    4. Return response with full transparency
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

        gemini = get_gemini_function_calling(api_key)

        # Auto-detect mode if not specified
        mode = request.mode
        if mode == "auto":
            mode = _detect_mode(request.message)

        # Select appropriate system prompt
        system_prompt = _get_system_prompt(mode)

        # Get user context for personalization
        user_context = await _get_user_context(request.user_id)

        # Get memory service
        from services.memory_service import get_memory_service
        memory = get_memory_service()

        # Save USER message
        await memory.add_message(
            session_id=request.session_id,
            role="user",
            content=request.message,
            metadata={"mode": mode}
        )

        # Send to Gemini with function calling
        response = await gemini.chat(
            message=request.message,
            session_id=request.session_id,
            system_prompt=system_prompt,
            mode=mode,
            user_context=user_context
        )

        # Extract warnings from function result
        warnings = []
        verified_by = []

        if response.function_result:
            warnings = response.function_result.get("warnings", [])
            verified_by = response.function_result.get("verified_by", [])

            # Add validation-specific info
            if response.function_result.get("physics_checks"):
                for check in response.function_result["physics_checks"]:
                    if check.get("law"):
                        verified_by.append(check["law"])

        # Record learning event in background
        if response.function_call:
            background_tasks.add_task(
                _record_interaction,
                request.user_id,
                request.message,
                response.function_call.get("name"),
                mode
            )

        # Save AI message
        ai_content = response.final_response or "I couldn't generate a response."
        func_name = None
        if response.function_call:
            try:
                func_name = response.function_call.get("name")
            except AttributeError:
                # Handle unexpected structure
                func_name = getattr(response.function_call, 'name', None)

        await memory.add_message(
            session_id=request.session_id,
            role="assistant",
            content=ai_content,
            metadata={
                "function_called": func_name,
                "confidence": response.confidence,
                "verified": bool(verified_by)
            }
        )

        return ChatResponse(
            response=ai_content,
            function_called=response.function_call.get("name") if response.function_call else None,
            function_result=response.function_result,
            reasoning_steps=response.reasoning_chain,
            confidence=response.confidence,
            verified_by=list(set(verified_by)),
            warnings=warnings,
            metadata={
                "mode": mode,
                "session_id": request.session_id,
                "timestamp": datetime.now().isoformat()
            }
        )

    except Exception as e:
        logger.exception(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze", response_model=CircuitAnalysisResponse)
async def analyze_circuit(
    request: CircuitAnalysisRequest,
    background_tasks: BackgroundTasks
) -> CircuitAnalysisResponse:
    """
    Dedicated circuit analysis endpoint with mandatory validation.

    This endpoint:
    1. Always calls analyze_circuit function
    2. Always validates the solution
    3. Returns structured, verified response
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

        gemini = get_gemini_function_calling(api_key)
        user_context = await _get_user_context(request.user_id)

        # Build analysis description
        description = request.description
        if request.components:
            description += f"\n\nComponents: {', '.join(request.components)}"
        description += f"\nSupply voltage: {request.supply_voltage}V"

        result = await gemini.analyze_with_validation(
            circuit_description=description,
            session_id=request.session_id,
            system_prompt=CIRCUIT_DEBUG_PROMPT,
            user_context=user_context
        )

        # Parse function result for structured response
        func_result = result.get("function_result") or {}

        physics_analysis = {}
        if func_result.get("physics_checks"):
            physics_analysis = {
                "checks": func_result["physics_checks"],
                "calculations": func_result.get("calculations", {})
            }

        solution_steps = []
        if func_result.get("potential_faults"):
            for fault in func_result["potential_faults"]:
                if fault.get("fix"):
                    solution_steps.append(fault["fix"])

        warnings = func_result.get("warnings", [])
        if func_result.get("potential_faults"):
            for fault in func_result["potential_faults"]:
                if fault.get("severity") == "critical":
                    warnings.append(f"CRITICAL: {fault.get('description', '')}")

        # Extract root cause
        root_cause = None
        if func_result.get("potential_faults"):
            root_cause = func_result["potential_faults"][0].get("root_cause")

        # If Gemini didn't call a function, run analysis directly ourselves
        if not func_result:
            from services.function_executor import execute_function as exec_fn
            direct_result = await exec_fn("analyze_circuit", {
                "components": request.components,
                "supply_voltage": request.supply_voltage,
                "issue_description": request.description,
                "circuit_type": "unknown",
            })
            func_result = direct_result
            physics_analysis = {}
            if func_result.get("physics_checks"):
                physics_analysis = {
                    "checks": func_result["physics_checks"],
                    "calculations": func_result.get("calculations", {})
                }
            solution_steps = []
            if func_result.get("potential_faults"):
                for fault in func_result["potential_faults"]:
                    if fault.get("fix"):
                        solution_steps.append(fault["fix"])
            warnings = func_result.get("warnings", [])
            if func_result.get("potential_faults"):
                for fault in func_result["potential_faults"]:
                    if fault.get("severity") == "critical":
                        warnings.append(f"CRITICAL: {fault.get('description', '')}")
            root_cause = None
            if func_result.get("potential_faults"):
                root_cause = func_result["potential_faults"][0].get("root_cause")

        return CircuitAnalysisResponse(
            summary=result.get("response") or "Analysis complete",
            root_cause=root_cause,
            physics_analysis=physics_analysis,
            solution_steps=solution_steps,
            validation_status=func_result.get("validation_status", func_result.get("confidence", "unknown")),
            verified_by=func_result.get("verified_by", []),
            warnings=warnings,
            learning_tip=_generate_learning_tip(func_result),
            confidence=result.get("confidence", "medium")
        )

    except Exception as e:
        logger.exception(f"Error in circuit analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/learn")
async def generate_learning_content(request: LearningRequest) -> dict:
    """
    Generate personalized learning content.

    Formats:
    - viva_questions: Exam preparation questions with answers
    - concept_summary: Key points and formulas
    - practice_problems: Calculation exercises
    - quick_review: Rapid review checklist
    """
    try:
        result = await execute_function("generate_learning_summary", {
            "topic": request.topic,
            "skill_level": request.skill_level,
            "format": request.format,
            "focus_areas": None
        })

        return {
            "topic": request.topic,
            "format": request.format,
            "skill_level": request.skill_level,
            "content": result.get("content", {}),
            "generated_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.exception(f"Error generating learning content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str) -> UserProfileResponse:
    """Get user's learning profile for dashboard display."""
    try:
        result = await execute_function("get_user_learning_profile", {
            "user_id": user_id,
            "include_history": False
        })

        return UserProfileResponse(
            user_id=result.get("user_id", user_id),
            skill_level=result.get("skill_level", "beginner"),
            topics_explored=result.get("topics_explored", {}),
            common_mistakes=result.get("common_mistakes", []),
            strengths=result.get("strengths", []),
            recommended_difficulty=result.get("recommended_difficulty", "easy")
        )

    except Exception as e:
        logger.exception(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasheet")
async def fetch_datasheet(request: DatasheetRequest) -> dict:
    """Fetch component datasheet information."""
    try:
        result = await execute_function("fetch_datasheet", {
            "component": request.component,
            "info_type": request.info_type
        })
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate")
async def calculate_component(request: CalculateRequest) -> dict:
    """
    Perform verified component calculations.

    calculation_type options:
    - led_resistor: Calculate LED current limiting resistor
    - voltage_divider: Calculate voltage divider output
    - power_dissipation: Calculate power dissipation
    - rc_time_constant: Calculate RC time constant
    - rc_cutoff_frequency: Calculate RC filter cutoff
    """
    try:
        result = await execute_function("calculate_component_value", {
            "calculation_type": request.calculation_type,
            "inputs": request.inputs
        })
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _detect_mode(message: str) -> str:
    """Detect the appropriate mode from message content."""
    message_lower = message.lower()

    # Debug indicators
    debug_keywords = [
        "not working", "doesn't work", "won't", "failed", "error",
        "wrong", "broken", "issue", "problem", "help", "debug",
        "why", "burning", "hot", "smoke", "dim", "flickering"
    ]

    # Planning indicators
    planning_keywords = [
        "build", "make", "create", "design", "project", "plan",
        "want to", "how do i", "need to", "should i use"
    ]

    # Learning indicators
    learning_keywords = [
        "explain", "what is", "how does", "viva", "exam",
        "learn", "understand", "teach", "theory"
    ]

    if any(kw in message_lower for kw in debug_keywords):
        return "debug"
    elif any(kw in message_lower for kw in planning_keywords):
        return "planning"
    elif any(kw in message_lower for kw in learning_keywords):
        return "learning"

    return "all"


def _get_system_prompt(mode: str) -> str:
    """Get the appropriate system prompt for the mode."""
    prompts = {
        "debug": CIRCUIT_DEBUG_PROMPT,
        "planning": PROJECT_PLANNING_PROMPT,
        "learning": ELECTRONICS_INSTRUCTOR_PROMPT,
        "all": ELECTRONICS_INSTRUCTOR_PROMPT
    }
    return prompts.get(mode, ELECTRONICS_INSTRUCTOR_PROMPT)


async def _get_user_context(user_id: str) -> dict:
    """Get user context for personalization."""
    try:
        result = await execute_function("get_user_learning_profile", {
            "user_id": user_id,
            "include_history": False
        })
        return result
    except Exception:
        return {
            "skill_level": "beginner",
            "common_mistakes": [],
            "strengths": []
        }


async def _record_interaction(
    user_id: str,
    message: str,
    function_name: str | None,
    mode: str
):
    """Record interaction for learning tracking."""
    try:
        # Determine event type
        if function_name == "analyze_circuit":
            event_type = "asked_for_help"
            topic = "circuit_debugging"
        elif function_name == "generate_learning_summary":
            event_type = "concept_understood"
            topic = "learning"
        else:
            event_type = "asked_for_help"
            topic = mode

        await execute_function("record_learning_event", {
            "user_id": user_id,
            "event_type": event_type,
            "topic": topic,
            "difficulty": "medium"
        })
    except Exception as e:
        logger.warning(f"Failed to record interaction: {e}")


def _generate_learning_tip(analysis_result: dict) -> str | None:
    """Generate a learning tip from analysis result."""
    if not analysis_result:
        return None

    tips = []

    # Generate tips based on detected faults
    faults = analysis_result.get("potential_faults", [])
    for fault in faults[:1]:  # Take first fault
        fault_type = fault.get("type", "")
        if "current" in fault_type.lower():
            tips.append("Remember: Ohm's Law (I = V/R) is fundamental for current calculations.")
        elif "power" in fault_type.lower():
            tips.append("Power dissipation (P = I²R) determines component heating. Always check ratings!")
        elif "grounding" in fault_type.lower():
            tips.append("Common ground is essential - all voltage measurements are relative to ground.")

    # Physics checks tips
    physics = analysis_result.get("physics_checks", [])
    for check in physics[:1]:
        if check.get("law") == "Ohm's Law":
            tips.append("For viva: Be ready to derive current, voltage, or resistance from Ohm's Law.")

    return tips[0] if tips else None
