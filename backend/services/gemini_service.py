"""
Centralized Gemini AI Service for ElectroLab
Handles all AI interactions with proper error handling, retries, and fallbacks.
"""

import os
import json
import asyncio
import hashlib
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


class SkillLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


@dataclass
class UserContext:
    """User context for personalized responses."""
    user_id: str
    skill_level: SkillLevel = SkillLevel.BEGINNER
    current_project: Optional[str] = None
    project_type: Optional[str] = None  # IoT, Robotics, Audio, Power
    board_type: Optional[str] = None  # ESP32, Arduino, etc.
    recent_topics: List[str] = field(default_factory=list)
    common_mistakes: List[str] = field(default_factory=list)


@dataclass
class ConversationSummary:
    """Summarized conversation for context window management."""
    key_points: List[str]
    components_discussed: List[str]
    problems_identified: List[str]
    solutions_provided: List[str]
    user_questions: List[str]


# ============================================================================
# SYSTEM PROMPTS
# ============================================================================

ELECTRONICS_INSTRUCTOR_PROMPT = """You are **DebugMate**, an expert electronics lab instructor at ElectroLab. You help university students plan, design, debug, and understand electronic circuits.

## Your Personality
- Patient and encouraging, like a real lab instructor
- You explain the "WHY" behind every concept, not just the "what"
- You use analogies and real-world examples
- You anticipate common student mistakes and address them proactively
- You speak clearly and avoid unnecessary jargon (but teach proper terminology)

## Teaching Approach
1. **Socratic Method**: Ask clarifying questions before jumping to solutions
2. **Root Cause Focus**: Always explain WHY a circuit fails, not just how to fix it
3. **Build Understanding**: Connect new concepts to fundamentals the student knows
4. **Practical Tips**: Share real lab experience (component selection, debugging tricks)
5. **Safety First**: Always mention safety concerns (high voltage, heat, ESD)

## When Debugging Circuits
Follow this structured approach:
1. **Understand the Goal**: What should the circuit do?
2. **Identify Symptoms**: What's actually happening?
3. **Form Hypotheses**: What could cause this mismatch?
4. **Systematic Testing**: How to verify each hypothesis?
5. **Root Cause**: What's the fundamental issue?
6. **Solution + Learning**: Fix it AND explain the underlying principle

## Response Guidelines
- For beginners: Use analogies, avoid complex math, focus on intuition
- For intermediate: Include calculations, discuss trade-offs
- For advanced: Discuss edge cases, optimization, professional practices

## What NOT to Do
- Don't just give answers without explanation
- Don't use overly complex language with beginners
- Don't skip safety warnings
- Don't assume the student knows basics without checking
- Don't provide code without explaining the logic

## Circuit Analysis Structure
When analyzing circuits, always provide:
1. Circuit topology identification
2. Expected behavior (with calculations)
3. Potential failure modes
4. Debugging steps
5. Learning points for viva/exams

Remember: Your goal is to help students UNDERSTAND, not just get their project working."""


CIRCUIT_DEBUG_PROMPT = """You are analyzing a circuit for debugging. The student needs help understanding why their circuit isn't working.

## Analysis Framework

### Step 1: Circuit Understanding
- Identify the circuit topology (amplifier, filter, power supply, etc.)
- List all components and their roles
- Determine expected operating conditions

### Step 2: Fault Analysis
For each potential issue, explain:
- **What's happening**: The observed symptom
- **Why it happens**: The physics/electronics principle
- **How to verify**: Measurement or test to confirm
- **How to fix**: Specific solution steps

### Step 3: Root Cause Chain
Trace the issue back to its source:
```
Symptom → Immediate Cause → Contributing Factors → Root Cause
```

### Step 4: Learning Points
Extract concepts the student should understand:
- Relevant theory (Kirchhoff's laws, Ohm's law, op-amp behavior, etc.)
- Common mistakes to avoid
- Viva questions they might face

## Output Format
Structure your response as JSON:
```json
{
  "circuit_analysis": {
    "topology": "string",
    "components": [{"name": "...", "role": "..."}],
    "expected_behavior": "string"
  },
  "fault_diagnosis": {
    "symptoms": ["..."],
    "root_cause": "string",
    "explanation": "string (detailed WHY)",
    "physics_principle": "string"
  },
  "solution": {
    "immediate_fix": "string",
    "steps": ["step1", "step2", ...],
    "component_changes": [{"from": "...", "to": "...", "reason": "..."}]
  },
  "verification": {
    "tests": ["test1", "test2"],
    "expected_readings": {"node": "value"}
  },
  "learning_notes": {
    "key_concepts": ["..."],
    "common_mistakes": ["..."],
    "viva_questions": [
      {"question": "...", "answer": "..."}
    ]
  },
  "safety_warnings": ["..."]
}
```"""


PROJECT_PLANNING_PROMPT = """You are helping a student plan an electronics project. Guide them through the planning process.

## Planning Framework

### Phase 1: Requirements Gathering
Ask about:
- What problem are they solving?
- What are the inputs and outputs?
- Power source (battery, USB, wall power)?
- Size/form factor constraints?
- Budget range?
- Timeline?

### Phase 2: Architecture Design
- Block diagram of the system
- Component selection with reasoning
- Interface between blocks
- Power distribution

### Phase 3: Component Selection
For each component, explain:
- Why this specific component
- Alternatives considered
- Trade-offs made
- Where to buy (approximate cost)

### Phase 4: Risk Assessment
- What could go wrong?
- Difficult parts of the project
- Skills they'll need to learn
- Fallback options

## Response Format
```json
{
  "project_summary": {
    "name": "string",
    "category": "IoT|Robotics|Audio|Power|Other",
    "difficulty": "beginner|intermediate|advanced",
    "estimated_cost": "string"
  },
  "clarifying_questions": ["..."],
  "system_architecture": {
    "block_diagram": "text description or mermaid syntax",
    "data_flow": "string"
  },
  "components": [
    {
      "name": "string",
      "quantity": 1,
      "purpose": "string",
      "alternatives": ["..."],
      "estimated_price": "string"
    }
  ],
  "connections": [
    {"from": "component.pin", "to": "component.pin", "notes": "string"}
  ],
  "risks": [
    {"risk": "string", "mitigation": "string", "severity": "low|medium|high"}
  ],
  "next_steps": ["step1", "step2"],
  "poll": {
    "question": "string (optional follow-up question)",
    "options": [{"id": "1", "label": "...", "description": "..."}]
  }
}
```"""


# ============================================================================
# GEMINI CLIENT
# ============================================================================

class GeminiService:
    """Centralized Gemini AI service with error handling and fallbacks."""

    def __init__(self):
        self.client = None
        self.model_name = "gemini-2.0-flash"  # More capable than flash-lite
        self.fallback_model = "gemini-2.0-flash-lite"
        self._init_client()

        # Rate limiting state
        self._request_times: List[datetime] = []
        self._rate_limit_window = 60  # seconds
        self._max_requests_per_window = 15  # Gemini free tier limit

        # Simple response cache
        self._cache: Dict[str, tuple] = {}  # hash -> (response, timestamp)
        self._cache_ttl = 300  # 5 minutes

    def _init_client(self):
        """Initialize Gemini client with proper configuration."""
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

        if not api_key or api_key == "MOCK":
            print("Gemini API: Running in MOCK mode")
            self.client = None
            return

        try:
            self.client = genai.Client(
                api_key=api_key,
                http_options={'api_version': 'v1beta'}
            )
            print(f"Gemini API: Initialized with model {self.model_name}")
        except Exception as e:
            print(f"Gemini API: Failed to initialize - {e}")
            self.client = None

    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self._rate_limit_window)

        # Clean old entries
        self._request_times = [t for t in self._request_times if t > cutoff]

        return len(self._request_times) < self._max_requests_per_window

    def _record_request(self):
        """Record a request for rate limiting."""
        self._request_times.append(datetime.now())

    def _get_cache_key(self, prompt: str, system_prompt: str) -> str:
        """Generate cache key for a request."""
        content = f"{system_prompt}:{prompt}"
        return hashlib.md5(content.encode()).hexdigest()

    def _get_cached(self, key: str) -> Optional[str]:
        """Get cached response if valid."""
        if key in self._cache:
            response, timestamp = self._cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self._cache_ttl):
                return response
            del self._cache[key]
        return None

    def _set_cached(self, key: str, response: str):
        """Cache a response."""
        self._cache[key] = (response, datetime.now())

        # Limit cache size
        if len(self._cache) > 100:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]

    async def generate(
        self,
        prompt: str,
        system_prompt: str = ELECTRONICS_INSTRUCTOR_PROMPT,
        user_context: Optional[UserContext] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        response_format: Literal["text", "json"] = "text",
        temperature: float = 0.7,
        max_retries: int = 3,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a response from Gemini with full context management.

        Args:
            prompt: User's message
            system_prompt: System instructions for the AI
            user_context: User's skill level, project context, etc.
            conversation_history: Previous messages in the conversation
            response_format: "text" or "json" for structured output
            temperature: Creativity level (0.0-1.0)
            max_retries: Number of retry attempts
            use_cache: Whether to use response caching

        Returns:
            Dict with 'content', 'success', 'error', 'is_mock', 'metadata'
        """

        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key(prompt, system_prompt)
            cached = self._get_cached(cache_key)
            if cached:
                return {
                    "content": cached,
                    "success": True,
                    "is_mock": False,
                    "is_cached": True,
                    "metadata": {}
                }

        # Check if client is available
        if not self.client:
            return self._get_mock_response(prompt, system_prompt)

        # Check rate limits
        if not self._check_rate_limit():
            return {
                "content": "I'm receiving a lot of requests right now. Please wait a moment and try again.",
                "success": False,
                "error": "rate_limited",
                "is_mock": True,
                "metadata": {"retry_after": 60}
            }

        # Build the full prompt with context
        full_prompt = self._build_contextual_prompt(
            prompt, system_prompt, user_context, conversation_history
        )

        # Configure generation
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": 4096,
        }

        if response_format == "json":
            generation_config["response_mime_type"] = "application/json"

        # Attempt generation with retries
        last_error = None
        for attempt in range(max_retries):
            try:
                self._record_request()

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(**generation_config)
                )

                content = response.text

                # Cache successful response
                if use_cache:
                    self._set_cached(cache_key, content)

                return {
                    "content": content,
                    "success": True,
                    "is_mock": False,
                    "is_cached": False,
                    "metadata": {
                        "model": self.model_name,
                        "finish_reason": str(response.candidates[0].finish_reason) if response.candidates else None
                    }
                }

            except Exception as e:
                last_error = str(e)

                # Handle specific errors
                if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                    # Rate limited - exponential backoff
                    wait_time = (2 ** attempt) * 5
                    print(f"Gemini rate limited. Waiting {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    continue

                elif "400" in last_error or "INVALID_ARGUMENT" in last_error:
                    # Bad request - don't retry
                    print(f"Gemini bad request: {last_error}")
                    break

                else:
                    # Other error - retry with backoff
                    wait_time = (2 ** attempt) * 2
                    print(f"Gemini error: {last_error}. Retrying in {wait_time}s")
                    await asyncio.sleep(wait_time)

        # All retries failed - return mock response
        mock_response = self._get_mock_response(prompt, system_prompt)
        mock_response["error"] = last_error
        mock_response["metadata"]["fallback_reason"] = "api_error"
        return mock_response

    def _build_contextual_prompt(
        self,
        prompt: str,
        system_prompt: str,
        user_context: Optional[UserContext],
        conversation_history: Optional[List[Dict[str, str]]]
    ) -> str:
        """Build a complete prompt with all context."""

        parts = [system_prompt]

        # Add user context
        if user_context:
            context_section = f"""
## Current User Context
- Skill Level: {user_context.skill_level.value}
- Current Project: {user_context.current_project or 'None'}
- Project Type: {user_context.project_type or 'Not specified'}
- Board: {user_context.board_type or 'Not specified'}
"""
            if user_context.recent_topics:
                context_section += f"- Recent Topics: {', '.join(user_context.recent_topics[-5:])}\n"
            if user_context.common_mistakes:
                context_section += f"- Known Weak Areas: {', '.join(user_context.common_mistakes[-3:])}\n"

            parts.append(context_section)

        # Add conversation history (summarized if too long)
        if conversation_history:
            history_text = self._format_conversation_history(conversation_history)
            parts.append(f"\n## Conversation History\n{history_text}")

        # Add current message
        parts.append(f"\n## Current Message\nUser: {prompt}")

        return "\n".join(parts)

    def _format_conversation_history(
        self,
        history: List[Dict[str, str]],
        max_messages: int = 10,
        max_chars: int = 4000
    ) -> str:
        """Format conversation history, summarizing if necessary."""

        # Take recent messages
        recent = history[-max_messages:] if len(history) > max_messages else history

        formatted = []
        total_chars = 0

        for msg in reversed(recent):
            role = msg.get("role", "user")
            content = msg.get("content", "")

            # Truncate long messages
            if len(content) > 500:
                content = content[:500] + "..."

            line = f"{role.capitalize()}: {content}"

            if total_chars + len(line) > max_chars:
                formatted.insert(0, "[Earlier conversation summarized]")
                break

            formatted.insert(0, line)
            total_chars += len(line)

        return "\n".join(formatted)

    def _get_mock_response(self, prompt: str, system_prompt: str) -> Dict[str, Any]:
        """Generate a contextual mock response for demo/fallback."""

        prompt_lower = prompt.lower()

        # Detect intent and provide relevant mock response
        if any(word in prompt_lower for word in ["debug", "not working", "problem", "issue", "error", "wrong"]):
            content = self._get_debug_mock_response()
        elif any(word in prompt_lower for word in ["plan", "build", "create", "make", "project", "idea"]):
            content = self._get_planning_mock_response()
        elif any(word in prompt_lower for word in ["explain", "how", "why", "what is", "understand"]):
            content = self._get_explanation_mock_response(prompt)
        else:
            content = self._get_general_mock_response()

        return {
            "content": content,
            "success": True,
            "is_mock": True,
            "is_cached": False,
            "metadata": {"fallback_reason": "no_api_key"}
        }

    def _get_debug_mock_response(self) -> str:
        return """I'd be happy to help debug your circuit! To give you the best guidance, I need to understand what's happening.

**Let me ask a few questions:**

1. **What should the circuit do?** (Expected behavior)
2. **What's actually happening?** (Observed behavior)
3. **What have you already checked?**

While you gather that info, here are the most common issues I see with student projects:

**Power Issues (60% of problems)**
- Check VCC and GND connections with a multimeter
- Verify the power supply voltage at the component pins
- Look for accidental shorts (solder bridges, loose wires)

**Connection Issues (30% of problems)**
- Breadboard contact problems (try different rows)
- Loose jumper wires
- Wrong pin connections (double-check against datasheet)

**Component Issues (10% of problems)**
- Component damaged from ESD or overvoltage
- Wrong component value (check color codes/markings)
- Orientation matters for polarized components (LEDs, capacitors, ICs)

Share your circuit details and I'll help you systematically find the root cause!"""

    def _get_planning_mock_response(self) -> str:
        return """Great! Let's plan your project together. I'll guide you through the process like we would in a real lab session.

**First, help me understand your project:**

1. **What problem are you solving?** (Or what do you want to build?)
2. **What's your experience level?**
   - Beginner: First few projects
   - Intermediate: Comfortable with basic circuits
   - Advanced: Design own PCBs

3. **Constraints:**
   - Budget range?
   - Power source (battery/USB/wall)?
   - Size requirements?

**While you think about that, here are popular project categories:**

| Category | Example Projects | Typical Components |
|----------|-----------------|-------------------|
| **IoT/Smart Home** | Temp monitor, smart plug | ESP32, sensors, relays |
| **Robotics** | Line follower, arm | Motors, drivers, sensors |
| **Audio** | Amplifier, effects | Op-amps, audio ICs |
| **Power** | Charger, supply | Regulators, MOSFETs |

Tell me more about your idea and I'll help you create a complete project plan!"""

    def _get_explanation_mock_response(self, prompt: str) -> str:
        return f"""Good question! Let me explain this in a way that builds real understanding.

**The Short Answer:**
I'll provide a clear explanation once you share more details about what you'd like to understand.

**The "Why" Behind It:**
In electronics, understanding WHY something works is more important than just knowing WHAT to do. This helps you:
- Debug problems independently
- Design new circuits
- Answer viva questions confidently

**How I'll Explain:**
1. Start with the basic principle
2. Connect it to what you already know
3. Show practical examples
4. Point out common mistakes
5. Give you viva-ready explanations

What specific concept would you like me to explain? The more specific you are, the better I can tailor my explanation to your level."""

    def _get_general_mock_response(self) -> str:
        return """Hello! I'm DebugMate, your electronics lab assistant. I'm here to help you:

- **Plan projects** - From idea to component list
- **Debug circuits** - Find out WHY things aren't working
- **Understand concepts** - Learn the theory behind your circuits
- **Prepare for viva** - Get ready to explain your work

**How can I help you today?**

You can:
1. Describe a project you want to build
2. Share a circuit problem you're facing
3. Ask about electronics concepts
4. Get help with component selection

I'll guide you step by step, just like a real lab instructor would!"""


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create the Gemini service singleton."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
