"""
Function Executor Service

This service routes Gemini function calls to their implementations.
It's the bridge between Gemini's function_call and FastAPI's execution.

Flow:
1. Gemini returns a function_call with name + args
2. This service routes to the correct function
3. Function executes and returns result
4. Result is sent back to Gemini as function_response
5. Gemini generates final user-facing response
"""

from typing import Any
import logging

from functions.circuit_functions import CircuitFunctions
from functions.knowledge_functions import KnowledgeFunctions
from functions.learning_functions import LearningFunctions
from services.validation_service import ValidationService

logger = logging.getLogger(__name__)


class FunctionExecutor:
    """
    Routes and executes Gemini function calls.

    Usage:
        executor = FunctionExecutor()
        result = await executor.execute(function_name, arguments)
    """

    def __init__(self):
        """Initialize function registry."""
        self._functions = {
            # Circuit analysis functions
            "analyze_circuit": self._analyze_circuit,
            "calculate_component_value": self._calculate_component_value,
            "validate_circuit_solution": self._validate_circuit_solution,

            # Knowledge/RAG functions
            "fetch_datasheet": self._fetch_datasheet,
            "fetch_lab_rule": self._fetch_lab_rule,
            "fetch_common_mistake": self._fetch_common_mistake,

            # Learning functions
            "get_user_learning_profile": self._get_user_learning_profile,
            "record_learning_event": self._record_learning_event,
            "generate_learning_summary": self._generate_learning_summary,

            # Project planning
            "generate_project_plan": self._generate_project_plan,
        }

    async def execute(
        self,
        function_name: str,
        arguments: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Execute a function by name with given arguments.

        Args:
            function_name: Name of the function to execute
            arguments: Dictionary of arguments from Gemini

        Returns:
            Function result as dictionary

        Raises:
            ValueError: If function name is unknown
        """
        if function_name not in self._functions:
            logger.error(f"Unknown function: {function_name}")
            return {
                "error": True,
                "message": f"Unknown function: {function_name}",
                "available_functions": list(self._functions.keys())
            }

        try:
            logger.info(f"Executing function: {function_name}")
            result = await self._functions[function_name](arguments)
            logger.info(f"Function {function_name} completed successfully")
            return result
        except Exception as e:
            logger.exception(f"Error executing {function_name}: {e}")
            return {
                "error": True,
                "message": str(e),
                "function": function_name
            }

    # =========================================================================
    # Circuit Functions
    # =========================================================================

    async def _analyze_circuit(self, args: dict) -> dict:
        """Execute circuit analysis."""
        return await CircuitFunctions.analyze_circuit(
            components=args.get("components", []),
            supply_voltage=args.get("supply_voltage", 5),
            issue_description=args.get("issue_description", ""),
            circuit_type=args.get("circuit_type", "unknown"),
            connections=args.get("connections")
        )

    async def _calculate_component_value(self, args: dict) -> dict:
        """Execute component calculation."""
        return await CircuitFunctions.calculate_component_value(
            calculation_type=args.get("calculation_type", ""),
            inputs=args.get("inputs", {})
        )

    async def _validate_circuit_solution(self, args: dict) -> dict:
        """Execute circuit validation."""
        return await ValidationService.validate_circuit_solution(
            circuit_type=args.get("circuit_type", ""),
            components=args.get("components", []),
            supply_voltage=args.get("supply_voltage", 5),
            expected_current=args.get("expected_current"),
            proposed_solution=args.get("proposed_solution")
        )

    # =========================================================================
    # Knowledge Functions
    # =========================================================================

    async def _fetch_datasheet(self, args: dict) -> dict:
        """Fetch component datasheet information."""
        return await KnowledgeFunctions.fetch_datasheet(
            component=args.get("component", ""),
            info_type=args.get("info_type", "all")
        )

    async def _fetch_lab_rule(self, args: dict) -> dict:
        """Fetch lab safety rules."""
        return await KnowledgeFunctions.fetch_lab_rule(
            category=args.get("category", "general_safety"),
            context=args.get("context")
        )

    async def _fetch_common_mistake(self, args: dict) -> dict:
        """Fetch common mistakes for a topic."""
        return await KnowledgeFunctions.fetch_common_mistake(
            topic=args.get("topic", ""),
            skill_level=args.get("skill_level", "beginner")
        )

    # =========================================================================
    # Learning Functions
    # =========================================================================

    async def _get_user_learning_profile(self, args: dict) -> dict:
        """Get user's learning profile."""
        return await LearningFunctions.get_user_learning_profile(
            user_id=args.get("user_id", "anonymous"),
            include_history=args.get("include_history", False)
        )

    async def _record_learning_event(self, args: dict) -> dict:
        """Record a learning event."""
        return await LearningFunctions.record_learning_event(
            user_id=args.get("user_id", "anonymous"),
            event_type=args.get("event_type", ""),
            topic=args.get("topic", ""),
            difficulty=args.get("difficulty", "medium"),
            details=args.get("details")
        )

    async def _generate_learning_summary(self, args: dict) -> dict:
        """Generate learning summary."""
        return await LearningFunctions.generate_learning_summary(
            topic=args.get("topic", ""),
            skill_level=args.get("skill_level", "beginner"),
            format=args.get("format", "quick_review"),
            focus_areas=args.get("focus_areas")
        )

    # =========================================================================
    # Project Planning
    # =========================================================================

    async def _generate_project_plan(self, args: dict) -> dict:
        """Generate a project plan."""
        # This would typically integrate with your existing project planning service
        # For now, return a structured response that Gemini will enhance

        project_desc = args.get("project_description", "")
        skill_level = args.get("skill_level", "beginner")
        budget = args.get("budget_constraint", "medium")
        available = args.get("available_components", [])

        # Component recommendations based on skill level
        component_suggestions = {
            "beginner": {
                "microcontroller": "Arduino Nano",
                "reason": "Easy to program, lots of tutorials"
            },
            "intermediate": {
                "microcontroller": "ESP32",
                "reason": "WiFi/BLE, more GPIOs, good documentation"
            },
            "advanced": {
                "microcontroller": "STM32",
                "reason": "Professional grade, more peripherals, better performance"
            }
        }

        return {
            "project_description": project_desc,
            "skill_level": skill_level,
            "budget_constraint": budget,
            "available_components": available,
            "recommended_mcu": component_suggestions.get(skill_level, component_suggestions["beginner"]),
            "planning_hints": {
                "phases": ["Requirements", "Component Selection", "Prototyping", "Testing", "Documentation"],
                "considerations": [
                    "Power requirements",
                    "Interface requirements (I2C, SPI, UART)",
                    "Enclosure/mounting",
                    "Safety requirements"
                ]
            },
            "note": "Gemini should elaborate on this structure based on specific project"
        }


# Singleton instance
_executor_instance: FunctionExecutor | None = None


def get_function_executor() -> FunctionExecutor:
    """Get the singleton function executor instance."""
    global _executor_instance
    if _executor_instance is None:
        _executor_instance = FunctionExecutor()
    return _executor_instance


async def execute_function(function_name: str, arguments: dict) -> dict:
    """Convenience function to execute a function call."""
    executor = get_function_executor()
    return await executor.execute(function_name, arguments)
