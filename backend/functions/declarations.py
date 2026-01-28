"""
ElectroLab Function Declarations for Gemini Function Calling

These declarations tell Gemini WHAT functions exist and WHEN to use them.
FastAPI handles the actual execution.

Architecture:
- Gemini receives these declarations
- Gemini decides when to call functions (AUTO mode)
- FastAPI executes functions and returns results
- Gemini generates final user-facing response

NO MCP. Classic Gemini function calling only.
"""

from typing import Any

# =============================================================================
# FUNCTION DECLARATION SCHEMAS (OpenAPI JSON format)
# =============================================================================

ANALYZE_CIRCUIT = {
    "name": "analyze_circuit",
    "description": """Analyze a circuit for faults, issues, or unexpected behavior.

USE THIS WHEN:
- User describes a circuit that isn't working
- User pastes component values and says something is wrong
- User asks "why isn't my circuit working?"
- User describes symptoms like "LED not lighting", "motor not spinning", "no output"

DO NOT USE WHEN:
- User is just asking a conceptual question
- User wants to learn theory without a specific circuit
- User is planning a new project (use generate_project_plan instead)

IMPORTANT: Always ask for missing information before calling this function.
Required info: supply voltage, component values, expected vs actual behavior.""",
    "parameters": {
        "type": "object",
        "properties": {
            "components": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of components in the circuit. Examples: ['resistor 10k', 'LED red', 'Arduino Nano', 'ESP32', 'capacitor 100uF']"
            },
            "supply_voltage": {
                "type": "number",
                "description": "Supply voltage in volts. Examples: 5, 3.3, 12, 9"
            },
            "issue_description": {
                "type": "string",
                "description": "What the user expects vs what's happening. Example: 'LED should light up but stays off'"
            },
            "circuit_type": {
                "type": "string",
                "enum": ["led_circuit", "voltage_divider", "rc_filter", "power_supply", "motor_driver", "sensor_interface", "amplifier", "oscillator", "logic_circuit", "unknown"],
                "description": "Type of circuit if identifiable"
            },
            "connections": {
                "type": "array",
                "items": {"type": "string"},
                "description": "How components are connected. Examples: ['resistor in series with LED', 'capacitor parallel to power rails']"
            }
        },
        "required": ["components", "supply_voltage", "issue_description"]
    }
}

CALCULATE_COMPONENT_VALUE = {
    "name": "calculate_component_value",
    "description": """Calculate component values using electronics formulas.

USE THIS WHEN:
- User asks "what resistor do I need for..."
- User needs to calculate current, voltage, power
- User wants voltage divider ratios
- User needs RC time constant or filter frequency
- User asks about LED current limiting resistors

IMPORTANT: This function performs VERIFIED calculations.
The result is validated by physics laws before returning.
Always show the formula used and the calculation steps.""",
    "parameters": {
        "type": "object",
        "properties": {
            "calculation_type": {
                "type": "string",
                "enum": [
                    "led_resistor",
                    "voltage_divider",
                    "power_dissipation",
                    "current_from_resistance",
                    "resistance_from_current",
                    "rc_time_constant",
                    "rc_cutoff_frequency",
                    "capacitor_charge_time",
                    "inductor_time_constant",
                    "transformer_ratio"
                ],
                "description": "Type of calculation to perform"
            },
            "inputs": {
                "type": "object",
                "description": "Input values for calculation. Keys depend on calculation_type.",
                "properties": {
                    "supply_voltage": {"type": "number", "description": "Vs in volts"},
                    "forward_voltage": {"type": "number", "description": "Vf for LED (typically 1.8-3.3V)"},
                    "forward_current": {"type": "number", "description": "If in milliamps (typically 10-20mA for LED)"},
                    "r1": {"type": "number", "description": "First resistor in ohms"},
                    "r2": {"type": "number", "description": "Second resistor in ohms"},
                    "resistance": {"type": "number", "description": "Resistance in ohms"},
                    "voltage": {"type": "number", "description": "Voltage in volts"},
                    "current": {"type": "number", "description": "Current in amps or milliamps"},
                    "capacitance": {"type": "number", "description": "Capacitance in farads or microfarads"},
                    "inductance": {"type": "number", "description": "Inductance in henries or millihenries"}
                }
            }
        },
        "required": ["calculation_type", "inputs"]
    }
}

FETCH_DATASHEET = {
    "name": "fetch_datasheet",
    "description": """Retrieve specifications and pinout information from component datasheets.

USE THIS WHEN:
- User asks about max current, voltage ratings, pin functions
- User needs to know specific component parameters
- User asks "what's the pinout of..."
- User wants to know component limits or specifications

This returns VERIFIED data from actual datasheets.
Always cite the source when presenting this information.""",
    "parameters": {
        "type": "object",
        "properties": {
            "component": {
                "type": "string",
                "description": "Component name or part number. Examples: 'ESP32', 'Arduino Nano', 'LM7805', 'LM35', '2N2222', 'NE555'"
            },
            "info_type": {
                "type": "string",
                "enum": ["pinout", "max_ratings", "electrical_characteristics", "typical_application", "all"],
                "description": "What type of information to retrieve"
            }
        },
        "required": ["component"]
    }
}

FETCH_LAB_RULE = {
    "name": "fetch_lab_rule",
    "description": """Retrieve laboratory safety rules and best practices.

USE THIS WHEN:
- User is about to do something potentially unsafe
- User asks about proper procedures
- User needs grounding or safety information
- You detect a potential safety issue in their circuit

This provides institutional-grade safety guidelines.""",
    "parameters": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["grounding", "power_supply", "high_voltage", "soldering", "esd_protection", "measurement", "general_safety"],
                "description": "Category of safety rule to retrieve"
            },
            "context": {
                "type": "string",
                "description": "Brief context about what the user is doing"
            }
        },
        "required": ["category"]
    }
}

VALIDATE_CIRCUIT_SOLUTION = {
    "name": "validate_circuit_solution",
    "description": """Validate a proposed circuit solution against physics laws and safety limits.

USE THIS WHEN:
- You've proposed component values and want to verify them
- You want to check if a circuit design is safe
- You need to validate calculations before presenting to user

This function checks:
- Ohm's law consistency
- Power dissipation limits
- Component rating compliance
- Safety margins

ALWAYS call this before presenting a solution that involves calculations.""",
    "parameters": {
        "type": "object",
        "properties": {
            "circuit_type": {
                "type": "string",
                "description": "Type of circuit being validated"
            },
            "components": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "value": {"type": "number"},
                        "unit": {"type": "string"},
                        "rating": {"type": "number", "description": "Max rating if applicable"}
                    }
                },
                "description": "Components with their values"
            },
            "supply_voltage": {
                "type": "number",
                "description": "Supply voltage in volts"
            },
            "expected_current": {
                "type": "number",
                "description": "Expected current in milliamps"
            },
            "proposed_solution": {
                "type": "string",
                "description": "Brief description of the proposed solution"
            }
        },
        "required": ["circuit_type", "components", "supply_voltage"]
    }
}

GENERATE_PROJECT_PLAN = {
    "name": "generate_project_plan",
    "description": """Generate a structured project plan with components and steps.

USE THIS WHEN:
- User wants to build a new project
- User asks "how do I make..."
- User needs a bill of materials
- User is planning a new circuit/system

DO NOT USE WHEN:
- User is debugging an existing circuit (use analyze_circuit)
- User is asking theoretical questions""",
    "parameters": {
        "type": "object",
        "properties": {
            "project_description": {
                "type": "string",
                "description": "What the user wants to build"
            },
            "skill_level": {
                "type": "string",
                "enum": ["beginner", "intermediate", "advanced"],
                "description": "User's skill level for appropriate component selection"
            },
            "budget_constraint": {
                "type": "string",
                "enum": ["low", "medium", "high", "no_constraint"],
                "description": "Budget level affects component recommendations"
            },
            "available_components": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Components user already has available"
            }
        },
        "required": ["project_description", "skill_level"]
    }
}

GENERATE_LEARNING_SUMMARY = {
    "name": "generate_learning_summary",
    "description": """Generate a learning summary or viva preparation material.

USE THIS WHEN:
- User asks for viva questions
- User wants to review what they learned
- Session is ending and user might benefit from summary
- User explicitly asks to study or prepare for exam

This generates skill-appropriate learning materials.""",
    "parameters": {
        "type": "object",
        "properties": {
            "topic": {
                "type": "string",
                "description": "Topic to generate learning material for"
            },
            "skill_level": {
                "type": "string",
                "enum": ["beginner", "intermediate", "advanced"],
                "description": "Difficulty level for generated content"
            },
            "format": {
                "type": "string",
                "enum": ["viva_questions", "concept_summary", "practice_problems", "quick_review"],
                "description": "Format of learning material"
            },
            "focus_areas": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Specific areas to focus on"
            }
        },
        "required": ["topic", "skill_level", "format"]
    }
}

FETCH_COMMON_MISTAKE = {
    "name": "fetch_common_mistake",
    "description": """Retrieve common mistakes related to a topic or component.

USE THIS WHEN:
- User is about to make a common mistake
- You want to warn user proactively
- User asks "what should I watch out for"
- Explaining why something failed due to typical error

This helps provide proactive guidance based on known error patterns.""",
    "parameters": {
        "type": "object",
        "properties": {
            "topic": {
                "type": "string",
                "description": "Topic or component to get common mistakes for"
            },
            "skill_level": {
                "type": "string",
                "enum": ["beginner", "intermediate", "advanced"],
                "description": "Filter mistakes by relevance to skill level"
            }
        },
        "required": ["topic"]
    }
}

GET_USER_LEARNING_PROFILE = {
    "name": "get_user_learning_profile",
    "description": """Retrieve user's learning profile including skill level and history.

USE THIS WHEN:
- Starting a new conversation to personalize responses
- Need to adjust explanation complexity
- Want to reference user's past mistakes or strengths

This provides personalization context.""",
    "parameters": {
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "User identifier"
            },
            "include_history": {
                "type": "boolean",
                "description": "Whether to include past session summaries"
            }
        },
        "required": ["user_id"]
    }
}

RECORD_LEARNING_EVENT = {
    "name": "record_learning_event",
    "description": """Record a learning event for adaptive difficulty tracking.

USE THIS WHEN:
- User successfully solved a problem
- User made a mistake that should be tracked
- User showed understanding of a concept
- Session is ending

This updates the adaptive learning system.""",
    "parameters": {
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "User identifier"
            },
            "event_type": {
                "type": "string",
                "enum": ["correct_answer", "mistake", "concept_understood", "asked_for_help", "completed_project"],
                "description": "Type of learning event"
            },
            "topic": {
                "type": "string",
                "description": "Topic related to the event"
            },
            "difficulty": {
                "type": "string",
                "enum": ["easy", "medium", "hard"],
                "description": "Difficulty of the task"
            },
            "details": {
                "type": "string",
                "description": "Additional details about the event"
            }
        },
        "required": ["user_id", "event_type", "topic"]
    }
}

# =============================================================================
# FUNCTION REGISTRY
# =============================================================================

FUNCTION_DECLARATIONS = [
    ANALYZE_CIRCUIT,
    CALCULATE_COMPONENT_VALUE,
    FETCH_DATASHEET,
    FETCH_LAB_RULE,
    VALIDATE_CIRCUIT_SOLUTION,
    GENERATE_PROJECT_PLAN,
    GENERATE_LEARNING_SUMMARY,
    FETCH_COMMON_MISTAKE,
    GET_USER_LEARNING_PROFILE,
    RECORD_LEARNING_EVENT
]

def get_all_declarations() -> list[dict[str, Any]]:
    """Return all function declarations for Gemini."""
    return FUNCTION_DECLARATIONS

def get_declaration_by_name(name: str) -> dict[str, Any] | None:
    """Get a specific function declaration by name."""
    for decl in FUNCTION_DECLARATIONS:
        if decl["name"] == name:
            return decl
    return None

def get_declarations_for_mode(mode: str) -> list[dict[str, Any]]:
    """Get function declarations appropriate for a specific mode.

    Modes:
    - debug: analyze_circuit, validate_circuit_solution, fetch_datasheet, fetch_common_mistake
    - planning: generate_project_plan, fetch_datasheet, get_user_learning_profile
    - learning: generate_learning_summary, record_learning_event, fetch_common_mistake
    - all: all functions
    """
    mode_functions = {
        "debug": [
            "analyze_circuit",
            "validate_circuit_solution",
            "fetch_datasheet",
            "fetch_common_mistake",
            "calculate_component_value",
            "fetch_lab_rule"
        ],
        "planning": [
            "generate_project_plan",
            "fetch_datasheet",
            "get_user_learning_profile",
            "calculate_component_value"
        ],
        "learning": [
            "generate_learning_summary",
            "record_learning_event",
            "fetch_common_mistake",
            "get_user_learning_profile"
        ],
        "all": [decl["name"] for decl in FUNCTION_DECLARATIONS]
    }

    allowed_names = mode_functions.get(mode, mode_functions["all"])
    return [decl for decl in FUNCTION_DECLARATIONS if decl["name"] in allowed_names]


# =============================================================================
# GEMINI CONFIGURATION
# =============================================================================

FUNCTION_CALLING_CONFIG = {
    "mode": "AUTO",  # Gemini decides when to call functions
    "allowed_function_names": [decl["name"] for decl in FUNCTION_DECLARATIONS]
}

# Tool config for Gemini API
def get_gemini_tools_config():
    """Return tools configuration for Gemini API call."""
    return {
        "function_declarations": FUNCTION_DECLARATIONS
    }
