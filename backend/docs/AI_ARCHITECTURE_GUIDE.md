# ElectroLab AI Architecture Guide

## Overview

This document describes the AI system architecture for ElectroLab/DebugMate, including Gemini integration, prompt engineering, conversation memory, and structured responses.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  ChatPage    │  │   Analyzer   │  │  CodeEditor  │  │  PCBViewer   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Backend                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         API Layer                                   │    │
│  │  /v2/chat/message  │  /v2/chat/debug  │  /v2/chat/plan            │    │
│  └────────────────────────────┬───────────────────────────────────────┘    │
│                               │                                             │
│  ┌────────────────────────────▼───────────────────────────────────────┐    │
│  │                      Service Layer                                  │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │    │
│  │  │ GeminiService   │  │ MemoryService   │  │ ResponseModels  │    │    │
│  │  │ - generate()    │  │ - get_profile() │  │ - Debug         │    │    │
│  │  │ - rate_limit    │  │ - get_history() │  │ - Planning      │    │    │
│  │  │ - retry logic   │  │ - summarize()   │  │ - Conversation  │    │    │
│  │  │ - fallback      │  │ - adapt_hints() │  │                 │    │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                               │                                             │
│  ┌────────────────────────────▼───────────────────────────────────────┐    │
│  │                      Prompts Layer                                  │    │
│  │  - ELECTRONICS_INSTRUCTOR_PROMPT                                    │    │
│  │  - CIRCUIT_DEBUG_PROMPT                                             │    │
│  │  - PROJECT_PLANNING_PROMPT                                          │    │
│  │  - Skill-level adapters                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                               │                                             │
│  ┌────────────────────────────▼───────────────────────────────────────┐    │
│  │                      Data Layer (MongoDB)                           │    │
│  │  - user_profiles    - chat_sessions    - conversation_summaries    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Google Gemini API │
                    │   gemini-3-flash-preview │
                    └─────────────────────┘
```

## 1. Gemini Integration

### File: `services/gemini_service.py`

### Key Features

#### Request Flow
```python
async def generate(
    prompt: str,
    system_prompt: str,           # Defines AI behavior
    user_context: UserContext,    # User skill level, project, etc.
    conversation_history: list,   # Recent messages
    response_format: str,         # "text" or "json"
    temperature: float,           # Creativity level
    max_retries: int              # Retry on failures
) -> Dict[str, Any]
```

#### Error Handling Strategy
```
1. Rate Limit (429)     → Exponential backoff (5s, 10s, 20s)
2. Bad Request (400)    → Don't retry, return error
3. Server Error (5xx)   → Retry with backoff
4. All retries failed   → Return contextual mock response
```

#### Rate Limiting
```python
# Free tier: ~15 requests/minute
# Implementation: Track requests in sliding window
_request_times: List[datetime] = []
_rate_limit_window = 60  # seconds
_max_requests_per_window = 15
```

#### Response Caching
```python
# Cache responses for 5 minutes to reduce API calls
# Hash-based cache key: MD5(system_prompt + user_prompt)
_cache: Dict[str, tuple] = {}  # hash -> (response, timestamp)
_cache_ttl = 300  # 5 minutes
```

### Model Selection
```python
# Primary: More capable, better for complex tasks
model_name = "gemini-3-flash-preview"

# Fallback: Faster, cheaper, for simpler tasks
fallback_model = "gemini-2.0-flash"
```

---

## 2. Prompt Engineering

### File: `prompts/system_prompts.py`

### Prompt Hierarchy

```
ELECTRONICS_INSTRUCTOR_PROMPT (Base)
    │
    ├── CIRCUIT_DEBUG_PROMPT
    │   └── + skill_level_adapter
    │   └── + circuit_context
    │   └── + user_mistake_warnings
    │
    ├── PROJECT_PLANNING_PROMPT
    │   └── + skill_level_adapter
    │   └── + preferred_boards
    │
    └── CONCEPT_EXPLANATION_PROMPT
        └── + skill_level_adapter
```

### Key Prompt Principles

#### 1. Role Definition
```
You are **DebugMate**, an expert electronics lab instructor...
```
- Clear identity prevents generic chatbot behavior
- Name gives personality

#### 2. Teaching Philosophy
```
1. Understanding Over Memorization
2. Socratic Method: Ask guiding questions
3. Practical Application: Connect theory to projects
4. Safety Awareness: Always mention concerns
5. Viva Preparation: Help explain concepts
```

#### 3. WHY-Focused Debugging
```
For each potential issue, explain:
- What's happening: The observed symptom
- Why it happens: The physics/electronics principle  ← MOST IMPORTANT
- How to verify: Measurement or test to confirm
- How to fix: Specific solution steps
```

#### 4. Skill Level Adaptation
```python
def adapt_prompt_for_skill_level(base_prompt: str, skill_level: str) -> str:
    adaptations = {
        "beginner": "Use analogies, avoid complex math...",
        "intermediate": "Include calculations, discuss trade-offs...",
        "advanced": "Be concise, discuss edge cases..."
    }
    return base_prompt + adaptations.get(skill_level)
```

### Avoiding Generic Responses

#### DO
```
"The op-amp output is saturated because the expected output
(Gain × Vin = -10 × 1.5V = -15V) exceeds the negative supply
rail (-12V). Think of it like trying to pour more water into
a glass that's already full..."
```

#### DON'T
```
"There seems to be an issue with your op-amp circuit.
Please check your connections and component values."
```

---

## 3. Conversation Memory

### File: `services/memory_service.py`

### Memory Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY LAYERS                                 │
├─────────────────┬───────────────────┬───────────────────────────┤
│   LONG-TERM     │    MEDIUM-TERM    │      SHORT-TERM          │
│   (Database)    │    (Session)      │      (Window)            │
├─────────────────┼───────────────────┼───────────────────────────┤
│ UserProfile:    │ SessionContext:   │ Recent Messages:          │
│ - skill_level   │ - project_name    │ - Last 5-10 messages     │
│ - topics        │ - components      │ - Full content           │
│ - mistakes      │ - problems        │                          │
│ - boards        │ - solutions       │ Older Messages:          │
│ - projects      │ - topics          │ - Summarized             │
├─────────────────┼───────────────────┼───────────────────────────┤
│ Persists:       │ Persists:         │ Persists:                │
│ Forever         │ Session duration  │ Context window           │
└─────────────────┴───────────────────┴───────────────────────────┘
```

### What to Store

#### Long-term (UserProfile)
```python
@dataclass
class UserProfile:
    skill_level: str           # beginner/intermediate/advanced
    topics_explored: Dict      # topic -> count
    common_mistakes: List[str] # Patterns to warn about
    preferred_boards: List[str]
    completed_projects: List[str]
```

#### Medium-term (SessionContext)
```python
@dataclass
class SessionContext:
    project_name: str
    project_type: str          # IoT, Robotics, etc.
    current_board: str
    components_discussed: List[str]
    problems_identified: List[str]
    topics_covered: List[str]
```

### Conversation Summarization

```python
def prepare_context_for_ai(history, session_context, user_profile):
    """
    Strategy:
    1. Recent messages (last 5): Full content
    2. Older messages: Summarized to key points
    3. Session context: Project, components, problems
    4. User profile: Skill level, past mistakes
    """

    # Example summary
    "User asked about: op-amp saturation; RC filter design
     Discussed: inverting amplifier gain; feedback resistor selection"
```

### Skill Level Detection

```python
async def update_skill_level(user_id: str, indicators: Dict):
    """
    Indicators:
    - complexity_of_questions: 1-10
    - uses_technical_terms: bool
    - asks_about_optimization: bool
    """
    # Only upgrade, never downgrade from single conversation
    if new_level > current_level:
        profile.skill_level = new_level
```

---

## 4. Structured AI Responses

### File: `services/ai_response_models.py`

### Response Types

#### Circuit Debug Response
```json
{
  "circuit_analysis": {
    "topology": "Inverting Amplifier",
    "circuit_type": "amplifier",
    "components": [
      {"name": "R1", "type": "resistor", "value": "10k", "role": "input resistor"}
    ],
    "expected_behavior": "Amplify input by -10x"
  },
  "fault_diagnosis": {
    "symptoms": ["Output stuck at -12V"],
    "root_cause": "Op-amp saturation due to excessive gain",
    "explanation": "The calculated output (-15V) exceeds the supply rail...",
    "physics_principle": "Op-amp output cannot exceed supply voltages",
    "severity": "medium"
  },
  "solution": {
    "immediate_fix": "Reduce feedback resistor to 50k",
    "steps": ["Step 1...", "Step 2..."],
    "component_changes": [
      {"component": "Rf", "current_value": "100k", "recommended_value": "50k", "reason": "..."}
    ]
  },
  "verification": {
    "tests": ["Measure Vout with oscilloscope"],
    "expected_readings": {"Vout": "-7.5V"},
    "success_criteria": "Output follows input linearly"
  },
  "learning_notes": {
    "key_concepts": ["Op-amp saturation", "Gain calculation"],
    "viva_questions": [
      {"question": "Why does saturation occur?", "answer": "..."}
    ]
  }
}
```

### Frontend Consumption

```typescript
// Type-safe response handling
interface DebugResponse {
  circuit_analysis: CircuitAnalysis;
  fault_diagnosis: FaultDiagnosis;
  solution: Solution;
  verification: Verification;
  learning_notes: LearningNotes;
}

// Display structured data
const DebugResult: React.FC<{ response: DebugResponse }> = ({ response }) => {
  return (
    <>
      <CircuitAnalysisCard data={response.circuit_analysis} />
      <FaultDiagnosisCard data={response.fault_diagnosis} />
      <SolutionCard data={response.solution} />
      <VerificationCard data={response.verification} />
      <LearningNotesCard data={response.learning_notes} />
    </>
  );
};
```

---

## 5. Edge Case Handling

### Incomplete Information

```python
# Detected when circuit_context lacks essential data
if not circuit_context["components"] and "debug" in msg_type:
    # AI prompt includes:
    INCOMPLETE_INFO_PROMPT = """
    1. Acknowledge what you DO understand
    2. Explain what additional info would help
    3. Ask specific, targeted questions
    4. Provide some general guidance anyway
    """
```

### Conflicting Information

```python
# Example: User says output is 12V but supply is 5V
if detected_conflict:
    # AI prompt includes:
    CONFLICTING_INFO_PROMPT = """
    1. Point out the apparent conflict politely
    2. Explain why values seem inconsistent
    3. Suggest which measurement might be incorrect
    4. Never make student feel stupid
    """
```

### Ambiguous Requests

```python
# Example: "How do I fix my circuit?"
if is_ambiguous:
    # Return poll asking for clarification
    {
        "content": "I'd like to help! Could you tell me more about...",
        "metadata": {
            "type": "poll",
            "poll_options": [
                {"id": "1", "label": "Debug existing circuit"},
                {"id": "2", "label": "Design new circuit"},
                {"id": "3", "label": "Understand a concept"}
            ]
        }
    }
```

---

## 6. Reliability & Fallbacks

### Fallback Strategy

```
Gemini API
    │
    ▼
Rate Limited? ──Yes──► Wait + Retry (exponential backoff)
    │
    No
    ▼
API Error? ──Yes──► Try fallback model
    │                    │
    No                   ▼
    │              Still Failed?
    │                    │
    │                   Yes
    │                    ▼
    ▼              Return Mock Response
Return AI Response      (contextual)
```

### Mock Response System

```python
def _get_mock_response(prompt: str, system_prompt: str) -> Dict:
    """Generate contextual mock response based on detected intent."""

    if "debug" in prompt.lower():
        return _get_debug_mock_response()
    elif "plan" in prompt.lower():
        return _get_planning_mock_response()
    elif "explain" in prompt.lower():
        return _get_explanation_mock_response(prompt)
    else:
        return _get_general_mock_response()
```

### Demo Mode

```bash
# Set in .env for demo/hackathon
GEMINI_API_KEY=MOCK

# This triggers full mock mode with realistic responses
# No API calls, instant responses
```

### Graceful Degradation

```
Full AI ──► Limited AI ──► Smart Mock ──► Basic Mock
  │              │              │              │
  │              │              │              └── Static helpful text
  │              │              └── Context-aware templates
  │              └── Fallback model (flash-lite)
  └── Primary model (flash)
```

---

## 7. API Reference

### Endpoints

#### POST `/v2/chat/message`
Main chat endpoint with auto-detection.

```python
Request:
{
    "content": str,              # User message
    "session_id": str | null,    # For conversation continuity
    "project_id": str | null,    # Link to project
    "message_type": str | null,  # "general" | "debug" | "planning"
    "circuit_data": dict | null  # Structured circuit data
}

Response:
{
    "id": str,
    "role": "assistant",
    "content": str,              # Markdown formatted
    "timestamp": datetime,
    "metadata": {
        "type": str | null,      # "poll" if has options
        "poll_options": list | null,
        "structured_response": dict | null,
        "is_mock": bool,
        "confidence": float | null
    }
}
```

#### POST `/v2/chat/debug`
Specialized debugging endpoint.

#### POST `/v2/chat/plan`
Specialized planning endpoint.

---

## 8. Future Improvements

### Short-term (Hackathon+)
- [ ] Add circuit schematic image analysis
- [ ] Implement RAG with electronics documentation
- [ ] Add real-time collaboration features

### Medium-term
- [ ] Fine-tune Gemini on electronics Q&A dataset
- [ ] Add spaced repetition for learning reinforcement
- [ ] Implement progress tracking dashboard

### Long-term (EdTech Product)
- [ ] Multi-language support
- [ ] College/institution dashboards
- [ ] Integration with simulation tools (LTSpice, Proteus)
- [ ] AR-based circuit overlay on physical boards
