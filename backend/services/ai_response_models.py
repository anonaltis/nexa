"""
Structured AI Response Models for ElectroLab
These models define the JSON structure that Gemini should return for various tasks.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CircuitType(str, Enum):
    AMPLIFIER = "amplifier"
    FILTER = "filter"
    POWER_SUPPLY = "power_supply"
    OSCILLATOR = "oscillator"
    DIGITAL_LOGIC = "digital_logic"
    SENSOR_INTERFACE = "sensor_interface"
    MOTOR_DRIVER = "motor_driver"
    LED_DRIVER = "led_driver"
    VOLTAGE_DIVIDER = "voltage_divider"
    OTHER = "other"


# ============================================================================
# CIRCUIT DEBUG RESPONSE
# ============================================================================

class ComponentRole(BaseModel):
    """A component and its role in the circuit."""
    name: str = Field(description="Component name (e.g., R1, C1, U1)")
    type: str = Field(description="Component type (resistor, capacitor, op-amp)")
    value: Optional[str] = Field(None, description="Component value if applicable")
    role: str = Field(description="What this component does in the circuit")


class CircuitAnalysis(BaseModel):
    """Analysis of the circuit topology and expected behavior."""
    topology: str = Field(description="Circuit type (e.g., 'Inverting Amplifier')")
    circuit_type: CircuitType = Field(description="Category of circuit")
    components: List[ComponentRole] = Field(default_factory=list)
    expected_behavior: str = Field(description="What the circuit should do when working correctly")
    key_specifications: Dict[str, str] = Field(
        default_factory=dict,
        description="Key specs like gain, cutoff frequency, output voltage"
    )


class FaultDiagnosis(BaseModel):
    """Diagnosis of circuit faults."""
    symptoms: List[str] = Field(description="Observable symptoms")
    root_cause: str = Field(description="The fundamental cause of the problem")
    explanation: str = Field(description="Detailed explanation of WHY this happens")
    physics_principle: str = Field(description="The underlying physics/electronics principle")
    fault_chain: List[str] = Field(
        default_factory=list,
        description="Symptom -> Immediate Cause -> Root Cause chain"
    )
    severity: Severity = Field(Severity.MEDIUM)


class ComponentChange(BaseModel):
    """A recommended component change."""
    component: str = Field(description="Component to change (e.g., R1)")
    current_value: str = Field(description="Current value")
    recommended_value: str = Field(description="Recommended new value")
    reason: str = Field(description="Why this change helps")


class Solution(BaseModel):
    """Solution to the circuit problem."""
    immediate_fix: str = Field(description="Quick fix to try first")
    steps: List[str] = Field(description="Step-by-step fix instructions")
    component_changes: List[ComponentChange] = Field(default_factory=list)
    alternative_approaches: List[str] = Field(
        default_factory=list,
        description="Other ways to solve this if the main fix doesn't work"
    )


class Verification(BaseModel):
    """How to verify the fix worked."""
    tests: List[str] = Field(description="Tests to perform")
    expected_readings: Dict[str, str] = Field(
        default_factory=dict,
        description="Expected multimeter/oscilloscope readings"
    )
    success_criteria: str = Field(description="How to know it's working")


class VivaQuestion(BaseModel):
    """A potential viva question with answer."""
    question: str
    answer: str
    difficulty: str = Field("medium", description="easy, medium, hard")


class LearningNotes(BaseModel):
    """Educational content for the student."""
    key_concepts: List[str] = Field(description="Important concepts to understand")
    common_mistakes: List[str] = Field(description="Mistakes to avoid in the future")
    viva_questions: List[VivaQuestion] = Field(default_factory=list)
    further_reading: List[str] = Field(
        default_factory=list,
        description="Topics to study for deeper understanding"
    )
    real_world_applications: List[str] = Field(
        default_factory=list,
        description="Where this circuit is used in real products"
    )


class CircuitDebugResponse(BaseModel):
    """Complete structured response for circuit debugging."""
    circuit_analysis: CircuitAnalysis
    fault_diagnosis: FaultDiagnosis
    solution: Solution
    verification: Verification
    learning_notes: LearningNotes
    safety_warnings: List[str] = Field(default_factory=list)
    confidence_level: float = Field(
        0.8,
        description="How confident the AI is in this diagnosis (0-1)"
    )
    needs_more_info: List[str] = Field(
        default_factory=list,
        description="Additional information that would help diagnosis"
    )


# ============================================================================
# PROJECT PLANNING RESPONSE
# ============================================================================

class ProjectComponent(BaseModel):
    """A component needed for the project."""
    name: str
    quantity: int = 1
    purpose: str = Field(description="Why this component is needed")
    specifications: Optional[str] = Field(None, description="Key specs to look for")
    alternatives: List[str] = Field(default_factory=list)
    estimated_price_usd: Optional[float] = None
    purchase_notes: Optional[str] = Field(None, description="Where to buy, what to look for")


class Connection(BaseModel):
    """A connection between components."""
    from_component: str
    from_pin: str
    to_component: str
    to_pin: str
    wire_color: Optional[str] = Field(None, description="Suggested wire color for organization")
    notes: Optional[str] = None


class Risk(BaseModel):
    """A project risk."""
    risk: str
    mitigation: str
    severity: Severity
    likelihood: str = Field("medium", description="low, medium, high")


class PollOption(BaseModel):
    """Option for a poll/question."""
    id: str
    label: str
    description: Optional[str] = None


class Poll(BaseModel):
    """A follow-up poll/question for the user."""
    question: str
    options: List[PollOption]


class ProjectPlanResponse(BaseModel):
    """Complete structured response for project planning."""
    project_summary: Dict[str, Any] = Field(
        description="name, category, difficulty, estimated_cost, estimated_time"
    )
    clarifying_questions: List[str] = Field(
        default_factory=list,
        description="Questions to ask before finalizing the plan"
    )
    system_architecture: Dict[str, str] = Field(
        default_factory=dict,
        description="block_diagram, data_flow description"
    )
    components: List[ProjectComponent] = Field(default_factory=list)
    connections: List[Connection] = Field(default_factory=list)
    power_requirements: Dict[str, str] = Field(
        default_factory=dict,
        description="voltage, current, battery life estimates"
    )
    software_requirements: List[str] = Field(
        default_factory=list,
        description="Libraries, frameworks, IDEs needed"
    )
    risks: List[Risk] = Field(default_factory=list)
    milestones: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Project milestones with descriptions"
    )
    next_steps: List[str] = Field(default_factory=list)
    poll: Optional[Poll] = Field(None, description="Optional follow-up question")


# ============================================================================
# CONVERSATIONAL RESPONSE
# ============================================================================

class ConversationalResponse(BaseModel):
    """Response for general conversation (non-debug, non-planning)."""
    message: str = Field(description="Main response text (markdown supported)")
    follow_up_questions: List[str] = Field(
        default_factory=list,
        description="Suggested follow-up questions"
    )
    related_topics: List[str] = Field(
        default_factory=list,
        description="Related topics the user might want to explore"
    )
    code_snippets: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Code examples with language and content"
    )
    diagrams: List[Dict[str, str]] = Field(
        default_factory=list,
        description="ASCII or mermaid diagrams"
    )
    poll: Optional[Poll] = None


# ============================================================================
# RESPONSE PARSER
# ============================================================================

def parse_ai_response(response_text: str, expected_type: str = "conversational") -> Dict[str, Any]:
    """
    Parse AI response into structured format.
    Falls back gracefully if JSON parsing fails.

    Args:
        response_text: Raw text from Gemini
        expected_type: "debug", "planning", or "conversational"

    Returns:
        Parsed response dict
    """
    import json

    # Try to extract JSON from response
    text = response_text.strip()

    # Handle markdown code blocks
    if "```json" in text:
        start = text.find("```json") + 7
        end = text.find("```", start)
        if end > start:
            text = text[start:end].strip()
    elif "```" in text:
        start = text.find("```") + 3
        end = text.find("```", start)
        if end > start:
            text = text[start:end].strip()

    try:
        parsed = json.loads(text)
        return {"success": True, "data": parsed, "raw": response_text}
    except json.JSONDecodeError:
        # Return as conversational response
        return {
            "success": False,
            "data": {
                "message": response_text,
                "follow_up_questions": [],
                "related_topics": []
            },
            "raw": response_text
        }


def validate_debug_response(data: Dict[str, Any]) -> CircuitDebugResponse:
    """Validate and parse a debug response."""
    try:
        return CircuitDebugResponse(**data)
    except Exception as e:
        # Return minimal valid response
        return CircuitDebugResponse(
            circuit_analysis=CircuitAnalysis(
                topology="Unknown",
                circuit_type=CircuitType.OTHER,
                expected_behavior="Unable to determine"
            ),
            fault_diagnosis=FaultDiagnosis(
                symptoms=["Unable to parse symptoms"],
                root_cause="Analysis incomplete",
                explanation=str(data),
                physics_principle="N/A"
            ),
            solution=Solution(
                immediate_fix="Please provide more circuit details",
                steps=["Share your circuit schematic", "Describe what's happening"]
            ),
            verification=Verification(
                tests=["Basic continuity check"],
                success_criteria="Circuit works as expected"
            ),
            learning_notes=LearningNotes(
                key_concepts=["Circuit debugging methodology"],
                common_mistakes=["Incomplete circuit description"]
            ),
            needs_more_info=["Circuit schematic", "Component values", "Observed symptoms"]
        )
