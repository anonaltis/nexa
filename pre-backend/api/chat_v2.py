"""
Enhanced Chat API for ElectroLab
Integrates Gemini AI with proper context management, structured responses, and fallbacks.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import json
import re
from auth_utils import get_current_user
from db import db
from bson import ObjectId

# Import services
from services.gemini_service import (
    get_gemini_service,
    GeminiService,
    UserContext,
    SkillLevel,
    ELECTRONICS_INSTRUCTOR_PROMPT,
    CIRCUIT_DEBUG_PROMPT,
    PROJECT_PLANNING_PROMPT
)
from services.memory_service import get_memory_service, MemoryService
from services.ai_response_models import (
    parse_ai_response,
    CircuitDebugResponse,
    ProjectPlanResponse
)

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class MessageType(str, Enum):
    GENERAL = "general"
    DEBUG = "debug"
    PLANNING = "planning"
    EXPLANATION = "explanation"


class PollOption(BaseModel):
    id: str
    label: str
    description: Optional[str] = None


class ChatMessageRequest(BaseModel):
    content: str
    session_id: Optional[str] = None
    project_id: Optional[str] = None
    message_type: Optional[MessageType] = None  # Auto-detected if not provided
    circuit_data: Optional[Dict[str, Any]] = None  # For debug requests
    selected_option: Optional[str] = None  # If responding to a poll


class ChatMessageMetadata(BaseModel):
    type: Optional[str] = None
    poll_options: Optional[List[PollOption]] = None
    structured_response: Optional[Dict[str, Any]] = None
    debug_analysis: Optional[Dict[str, Any]] = None
    is_mock: bool = False
    confidence: Optional[float] = None


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime
    metadata: Optional[ChatMessageMetadata] = None


# ============================================================================
# MESSAGE TYPE DETECTION
# ============================================================================

def detect_message_type(content: str) -> MessageType:
    """Auto-detect the type of message based on content."""
    content_lower = content.lower()

    # Debug indicators
    debug_keywords = [
        "not working", "doesn't work", "problem", "issue", "error",
        "wrong output", "unexpected", "debug", "help me fix",
        "why is", "what's wrong", "troubleshoot", "failed"
    ]
    if any(kw in content_lower for kw in debug_keywords):
        return MessageType.DEBUG

    # Planning indicators
    planning_keywords = [
        "build", "create", "make", "design", "plan",
        "project idea", "want to make", "how do i start",
        "components for", "circuit for"
    ]
    if any(kw in content_lower for kw in planning_keywords):
        return MessageType.PLANNING

    # Explanation indicators
    explanation_keywords = [
        "explain", "how does", "what is", "why does",
        "tell me about", "understand", "concept of",
        "difference between", "when to use"
    ]
    if any(kw in content_lower for kw in explanation_keywords):
        return MessageType.EXPLANATION

    return MessageType.GENERAL


def extract_circuit_context(content: str) -> Dict[str, Any]:
    """Extract circuit-related information from message content."""
    context = {
        "components": [],
        "values": {},
        "symptoms": [],
        "board": None
    }

    content_lower = content.lower()

    # Extract board type
    boards = {
        "esp32": ["esp32", "esp-32"],
        "esp8266": ["esp8266", "esp-8266", "nodemcu"],
        "arduino-uno": ["arduino uno", "uno"],
        "arduino-nano": ["arduino nano", "nano"],
        "raspberry-pi-pico": ["pico", "raspberry pi pico", "rp2040"]
    }
    for board_id, keywords in boards.items():
        if any(kw in content_lower for kw in keywords):
            context["board"] = board_id
            break

    # Extract components
    component_patterns = [
        (r"(\d+\.?\d*)\s*(k|m)?\s*ohm", "resistor"),
        (r"(\d+\.?\d*)\s*(u|n|p)?f\b", "capacitor"),
        (r"(\d+\.?\d*)\s*(m)?h\b", "inductor"),
        (r"led", "led"),
        (r"op-?amp|lm741|tl072|ne5532", "opamp"),
        (r"lm7805|lm317|ams1117", "regulator"),
        (r"dht\d+|lm35|ds18b20", "temperature sensor"),
        (r"hc-sr04|ultrasonic", "ultrasonic sensor"),
    ]

    for pattern, comp_type in component_patterns:
        matches = re.findall(pattern, content_lower)
        if matches:
            context["components"].append(comp_type)

    # Extract symptoms
    symptom_patterns = [
        (r"output is (\d+\.?\d*)\s*v", "measured_output"),
        (r"shows? (\d+\.?\d*)", "reading"),
        (r"getting (\d+\.?\d*)", "reading"),
        (r"nothing happens", "no_output"),
        (r"always (high|low|on|off)", "stuck_state"),
        (r"(hot|heating|overheating)", "thermal_issue"),
        (r"(flickering|unstable)", "instability")
    ]

    for pattern, symptom_type in symptom_patterns:
        if re.search(pattern, content_lower):
            context["symptoms"].append(symptom_type)

    return context


# ============================================================================
# MAIN CHAT ENDPOINT
# ============================================================================

@router.post("/message", response_model=ChatMessageResponse)
async def chat_message(
    request: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user)
):
    """
    Process a chat message with AI-powered response.

    Features:
    - Auto-detects message type (debug, planning, general)
    - Uses conversation history for context
    - Returns structured responses when appropriate
    - Graceful fallback to mock responses
    """

    gemini = get_gemini_service()
    memory = get_memory_service()

    # Get user profile for personalization
    user_profile = await memory.get_user_profile(current_user)

    # Get or create session context
    session_id = request.session_id
    session_context = memory.get_session_context(
        session_id or "temp",
        current_user
    ) if session_id else None

    # Save user message to session
    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": request.content,
        "timestamp": datetime.utcnow(),
        "metadata": None
    }
    if session_id:
        await _save_message_to_session(session_id, current_user, user_msg)

    # Detect message type
    msg_type = request.message_type or detect_message_type(request.content)

    # Extract circuit context from message
    circuit_context = extract_circuit_context(request.content)

    # Update session context
    if session_context and circuit_context["components"]:
        memory.update_session_context(
            session_id,
            components=circuit_context["components"],
            board=circuit_context["board"]
        )

    # Get conversation history
    history = []
    if session_id:
        history = await memory.get_conversation_history(session_id, max_messages=15)

    # Build user context for AI
    ai_user_context = UserContext(
        user_id=current_user,
        skill_level=SkillLevel(user_profile.skill_level),
        current_project=session_context.project_name if session_context else None,
        project_type=session_context.project_type if session_context else None,
        board_type=circuit_context["board"] or (session_context.current_board if session_context else None),
        recent_topics=list(user_profile.topics_explored.keys())[-5:],
        common_mistakes=user_profile.common_mistakes[-3:]
    )

    # Get response hints for personalization
    response_hints = memory.get_response_hints(user_profile, session_context) if session_context else {}

    # Select appropriate system prompt
    if msg_type == MessageType.DEBUG:
        system_prompt = _build_debug_prompt(user_profile, response_hints, circuit_context)
        response_format = "json"
    elif msg_type == MessageType.PLANNING:
        system_prompt = _build_planning_prompt(user_profile, response_hints)
        response_format = "json"
    else:
        system_prompt = _build_conversational_prompt(user_profile, response_hints)
        response_format = "text"

    # Generate AI response
    ai_response = await gemini.generate(
        prompt=request.content,
        system_prompt=system_prompt,
        user_context=ai_user_context,
        conversation_history=history,
        response_format=response_format,
        temperature=0.7 if msg_type == MessageType.GENERAL else 0.5
    )

    # Process the response
    content = ai_response["content"]
    metadata = ChatMessageMetadata(
        is_mock=ai_response.get("is_mock", False),
        confidence=ai_response.get("metadata", {}).get("confidence")
    )

    # Parse structured response if JSON
    if response_format == "json" and ai_response["success"]:
        parsed = parse_ai_response(content, msg_type.value)
        if parsed["success"]:
            metadata.structured_response = parsed["data"]
            # Convert to readable markdown for display
            content = _format_structured_response(parsed["data"], msg_type)

            # Extract and store learning info in background
            if msg_type == MessageType.DEBUG and "learning_notes" in parsed["data"]:
                background_tasks.add_task(
                    _record_learning_data,
                    memory,
                    current_user,
                    parsed["data"]
                )

    # Check for polls in response
    poll_data = _extract_poll_from_response(content, ai_response.get("metadata", {}))
    if poll_data:
        metadata.type = "poll"
        metadata.poll_options = [PollOption(**opt) for opt in poll_data["options"]]

    # Build response
    response_data = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": content,
        "timestamp": datetime.utcnow(),
        "metadata": metadata.model_dump() if metadata else None
    }

    # Save assistant response to session
    if session_id:
        await _save_message_to_session(session_id, current_user, response_data)

    # Update session context with topics discussed
    if session_context:
        topics = _extract_topics(content)
        if topics:
            memory.update_session_context(session_id, topics=topics)

        # Record topics to user profile in background
        for topic in topics:
            background_tasks.add_task(memory.record_topic, current_user, topic)

    return ChatMessageResponse(**response_data)


# ============================================================================
# SPECIALIZED ENDPOINTS
# ============================================================================

@router.post("/debug", response_model=ChatMessageResponse)
async def debug_circuit(
    request: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user)
):
    """
    Specialized endpoint for circuit debugging.
    Accepts circuit data and returns structured fault analysis.
    """
    # Force debug message type
    request.message_type = MessageType.DEBUG
    return await chat_message(request, background_tasks, current_user)


@router.post("/plan", response_model=ChatMessageResponse)
async def plan_project(
    request: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user)
):
    """
    Specialized endpoint for project planning.
    Returns structured project plan with components and connections.
    """
    request.message_type = MessageType.PLANNING
    return await chat_message(request, background_tasks, current_user)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _build_debug_prompt(
    profile,
    hints: Dict[str, Any],
    circuit_context: Dict[str, Any]
) -> str:
    """Build customized debug prompt based on user context."""
    prompt = CIRCUIT_DEBUG_PROMPT

    # Add skill-level specific instructions
    level_instructions = {
        "beginner": """
For this BEGINNER user:
- Use simple analogies (water flow for current, pressure for voltage)
- Avoid complex math, focus on intuition
- Explain every step in detail
- Emphasize safety warnings
- Suggest the simplest fix first
""",
        "intermediate": """
For this INTERMEDIATE user:
- Include relevant calculations
- Explain the physics principles briefly
- Discuss trade-offs in solutions
- Mention optimization opportunities
""",
        "advanced": """
For this ADVANCED user:
- Be concise, skip obvious explanations
- Discuss edge cases and corner conditions
- Include performance considerations
- Reference datasheets when relevant
"""
    }
    prompt += level_instructions.get(profile.skill_level, "")

    # Add circuit context if available
    if circuit_context["components"]:
        prompt += f"\n\nComponents mentioned by user: {', '.join(circuit_context['components'])}"
    if circuit_context["symptoms"]:
        prompt += f"\nSymptoms reported: {', '.join(circuit_context['symptoms'])}"
    if circuit_context["board"]:
        prompt += f"\nTarget board: {circuit_context['board']}"

    # Add warnings about past mistakes
    if hints.get("warn_about_mistakes"):
        prompt += f"\n\nThis user has previously made these mistakes - gently check if relevant: {hints['warn_about_mistakes']}"

    return prompt


def _build_planning_prompt(profile, hints: Dict[str, Any]) -> str:
    """Build customized planning prompt."""
    prompt = PROJECT_PLANNING_PROMPT

    level_adjustments = {
        "beginner": """
For this BEGINNER user:
- Suggest simpler projects with well-documented components
- Recommend kits or modules over discrete components
- Include detailed step-by-step guidance
- Warn about common pitfalls
- Keep cost low (<$30 for first project)
""",
        "intermediate": """
For this INTERMEDIATE user:
- Can handle moderate complexity
- Include PCB design considerations
- Suggest some optimization ideas
- Balance cost with features
""",
        "advanced": """
For this ADVANCED user:
- Can handle complex multi-board designs
- Discuss professional-grade approaches
- Include EMC/thermal considerations
- Suggest interesting challenges
"""
    }
    prompt += level_adjustments.get(profile.skill_level, "")

    if profile.preferred_boards:
        prompt += f"\n\nUser's preferred boards: {', '.join(profile.preferred_boards)}"

    return prompt


def _build_conversational_prompt(profile, hints: Dict[str, Any]) -> str:
    """Build customized conversational prompt."""
    prompt = ELECTRONICS_INSTRUCTOR_PROMPT

    # Add response style hints
    prompt += f"""

## Response Style for This User
- Skill level: {profile.skill_level}
- Explanation depth: {hints.get('explanation_level', 'moderate')}
- Use analogies: {'Yes' if hints.get('use_analogies', True) else 'No'}
- Include math: {'Yes' if hints.get('include_math', False) else 'Keep minimal'}
- Tone: {hints.get('tone', 'helpful and encouraging')}
"""
    return prompt


def _format_structured_response(data: Dict[str, Any], msg_type: MessageType) -> str:
    """Convert structured JSON response to readable markdown."""

    if msg_type == MessageType.DEBUG:
        return _format_debug_response(data)
    elif msg_type == MessageType.PLANNING:
        return _format_planning_response(data)
    else:
        return data.get("message", str(data))


def _format_debug_response(data: Dict[str, Any]) -> str:
    """Format debug response as markdown."""
    parts = []

    # Circuit Analysis
    if "circuit_analysis" in data:
        ca = data["circuit_analysis"]
        parts.append(f"## Circuit Analysis\n**Topology:** {ca.get('topology', 'Unknown')}")
        if ca.get("expected_behavior"):
            parts.append(f"\n**Expected Behavior:** {ca['expected_behavior']}")

    # Fault Diagnosis
    if "fault_diagnosis" in data:
        fd = data["fault_diagnosis"]
        parts.append(f"\n## Problem Diagnosis")
        parts.append(f"**Root Cause:** {fd.get('root_cause', 'Unknown')}")
        parts.append(f"\n**Why This Happens:**\n{fd.get('explanation', '')}")
        if fd.get("physics_principle"):
            parts.append(f"\n**Underlying Principle:** {fd['physics_principle']}")

    # Solution
    if "solution" in data:
        sol = data["solution"]
        parts.append(f"\n## Solution")
        if sol.get("immediate_fix"):
            parts.append(f"**Quick Fix:** {sol['immediate_fix']}")
        if sol.get("steps"):
            parts.append("\n**Steps:**")
            for i, step in enumerate(sol["steps"], 1):
                parts.append(f"{i}. {step}")

    # Verification
    if "verification" in data:
        ver = data["verification"]
        parts.append(f"\n## Verification")
        if ver.get("tests"):
            parts.append("**Tests to perform:**")
            for test in ver["tests"]:
                parts.append(f"- {test}")

    # Learning Notes
    if "learning_notes" in data:
        ln = data["learning_notes"]
        parts.append(f"\n## Learning Points")
        if ln.get("key_concepts"):
            parts.append("**Key Concepts:**")
            for concept in ln["key_concepts"]:
                parts.append(f"- {concept}")
        if ln.get("viva_questions"):
            parts.append("\n**Viva Questions:**")
            for vq in ln["viva_questions"][:3]:
                parts.append(f"- Q: {vq.get('question', '')}")
                parts.append(f"  A: {vq.get('answer', '')}")

    # Safety
    if data.get("safety_warnings"):
        parts.append(f"\n## Safety Warnings")
        for warning in data["safety_warnings"]:
            parts.append(f"- {warning}")

    return "\n".join(parts) if parts else str(data)


def _format_planning_response(data: Dict[str, Any]) -> str:
    """Format planning response as markdown."""
    parts = []

    # Project Summary
    if "project_summary" in data:
        ps = data["project_summary"]
        parts.append(f"## Project: {ps.get('name', 'New Project')}")
        parts.append(f"**Category:** {ps.get('category', 'Electronics')}")
        parts.append(f"**Difficulty:** {ps.get('difficulty', 'Unknown')}")
        if ps.get("estimated_cost"):
            parts.append(f"**Estimated Cost:** {ps['estimated_cost']}")

    # Clarifying Questions
    if data.get("clarifying_questions"):
        parts.append("\n## Questions for You")
        for q in data["clarifying_questions"]:
            parts.append(f"- {q}")

    # Components
    if data.get("components"):
        parts.append("\n## Components Needed")
        parts.append("| Component | Qty | Purpose |")
        parts.append("|-----------|-----|---------|")
        for comp in data["components"]:
            parts.append(f"| {comp.get('name', '')} | {comp.get('quantity', 1)} | {comp.get('purpose', '')} |")

    # Connections
    if data.get("connections"):
        parts.append("\n## Wiring Connections")
        for conn in data["connections"][:10]:  # Limit to 10
            parts.append(f"- {conn.get('from_component', '')}.{conn.get('from_pin', '')} → {conn.get('to_component', '')}.{conn.get('to_pin', '')}")

    # Risks
    if data.get("risks"):
        parts.append("\n## Potential Challenges")
        for risk in data["risks"]:
            severity = risk.get("severity", "medium")
            emoji = "" if severity == "high" else "" if severity == "medium" else ""
            parts.append(f"- {emoji} **{risk.get('risk', '')}**: {risk.get('mitigation', '')}")

    # Next Steps
    if data.get("next_steps"):
        parts.append("\n## Next Steps")
        for i, step in enumerate(data["next_steps"], 1):
            parts.append(f"{i}. {step}")

    return "\n".join(parts) if parts else str(data)


def _extract_poll_from_response(content: str, metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract poll data from response if present."""
    # Check if content contains poll-like questions with options
    if "poll" in metadata:
        return metadata["poll"]

    # Try to detect implicit polls in content
    option_pattern = r'\d+\.\s*\*\*([^*]+)\*\*'
    matches = re.findall(option_pattern, content)

    if len(matches) >= 2:
        return {
            "question": "Which option would you like to explore?",
            "options": [
                {"id": str(i), "label": m.strip(), "description": None}
                for i, m in enumerate(matches[:4], 1)
            ]
        }

    return None


def _extract_topics(content: str) -> List[str]:
    """Extract discussed topics from response content."""
    topic_keywords = {
        "amplifier": ["amplifier", "gain", "op-amp", "feedback"],
        "filter": ["filter", "cutoff", "frequency response", "low-pass", "high-pass"],
        "power": ["power supply", "regulator", "voltage", "current", "efficiency"],
        "sensor": ["sensor", "temperature", "humidity", "ultrasonic", "ir"],
        "motor": ["motor", "pwm", "h-bridge", "stepper", "servo"],
        "communication": ["i2c", "spi", "uart", "serial", "wifi", "bluetooth"],
        "display": ["display", "lcd", "oled", "led"],
        "microcontroller": ["esp32", "arduino", "raspberry", "gpio", "adc"]
    }

    content_lower = content.lower()
    found_topics = []

    for topic, keywords in topic_keywords.items():
        if any(kw in content_lower for kw in keywords):
            found_topics.append(topic)

    return found_topics


async def _save_message_to_session(session_id: str, user_id: str, message: Dict):
    """Helper to save a message to a chat session."""
    try:
        await db.db["chat_sessions"].update_one(
            {"_id": ObjectId(session_id), "user_id": user_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    except Exception as e:
        print(f"Failed to save message to session: {e}")


async def _record_learning_data(memory: MemoryService, user_id: str, data: Dict[str, Any]):
    """Background task to record learning data from debug response."""
    try:
        # Record any mistakes mentioned
        if "fault_diagnosis" in data:
            root_cause = data["fault_diagnosis"].get("root_cause", "")
            if root_cause and len(root_cause) < 200:
                await memory.record_mistake(user_id, root_cause)

        # Record topics
        if "learning_notes" in data:
            for concept in data["learning_notes"].get("key_concepts", [])[:3]:
                await memory.record_topic(user_id, concept.lower()[:50])
    except Exception as e:
        print(f"Error recording learning data: {e}")
