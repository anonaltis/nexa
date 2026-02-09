"""
Orchestrator Agent Service

Central intelligence that routes user requests to appropriate specialized agents.
Uses Gemini for intent detection and coordinates multi-agent workflows.

Agent Design Pattern: Router Pattern
- Detects user intent from natural language
- Routes to: Design, Diagnostic, Simulation, Code, Vision, Component agents
- Coordinates multi-step workflows
- Aggregates responses from multiple agents
"""

import logging
import os
import json
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    """Available specialized agents."""
    DESIGN = "design"
    DIAGNOSTIC = "diagnostic"
    SIMULATION = "simulation"
    CODE = "code"
    VISION = "vision"
    COMPONENT = "component"
    GENERAL = "general"  # For questions that don't need a specialized agent


@dataclass
class RouteDecision:
    """Result of intent routing."""
    primary_agent: AgentType
    secondary_agents: List[AgentType]
    confidence: float
    reasoning: str
    extracted_params: Dict[str, Any]


@dataclass
class OrchestratorResponse:
    """Unified response from orchestrator."""
    content: str
    agent_used: AgentType
    agent_results: Dict[str, Any]
    reasoning_chain: List[str]
    metadata: Dict[str, Any]


class OrchestratorAgent:
    """
    Orchestrator Agent - Central routing and coordination.
    
    Responsibilities:
    1. Intent Detection: Understand what the user wants
    2. Agent Selection: Choose the best agent(s) for the task
    3. Coordination: Manage multi-agent workflows
    4. Response Aggregation: Combine results into unified response
    """
    
    INTENT_DETECTION_PROMPT = """You are an intent classifier for an electronics project assistant.

Analyze the user's message and determine which specialized agent should handle it.

Available agents:
1. DESIGN - For creating new circuits, schematics, PCB designs, project planning
2. DIAGNOSTIC - For troubleshooting, debugging, finding faults in circuits
3. SIMULATION - For running circuit simulations, frequency analysis, transient analysis
4. CODE - For generating firmware, Arduino/ESP32 code, embedded programming
5. VISION - For analyzing images of PCBs, schematics, or circuit photos
6. COMPONENT - For component search, recommendations, datasheet information
7. GENERAL - For general electronics questions, theory, explanations

Return JSON:
{
    "primary_agent": "DESIGN|DIAGNOSTIC|SIMULATION|CODE|VISION|COMPONENT|GENERAL",
    "secondary_agents": [],
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation",
    "extracted_params": {
        "components": [],
        "board_type": null,
        "circuit_type": null,
        "issue_description": null
    }
}"""

    def __init__(self):
        self._init_api()
        self._agent_instances = {}
    
    def _init_api(self):
        """Initialize Gemini client."""
        self.api_key = (
            os.getenv("ORCHESTRATOR_API_KEY") or
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY")
        )
        
        if not self.api_key or self.api_key == "MOCK" or os.getenv("DEMO_MODE") == "true":
            logger.warning("Orchestrator Agent: Demo mode enabled")
            self.is_mock = True
            return
        
        self.is_mock = False
        self._client = genai.Client(
            api_key=self.api_key,
            http_options=types.HttpOptions(api_version='v1')
        )
        self.client = self._client.aio
        self.model_name = "gemini-3-flash-preview"
    
    async def detect_intent(self, user_query: str, context: Dict = None) -> RouteDecision:
        """
        Detect user intent and determine routing.
        
        Args:
            user_query: User's natural language query
            context: Optional context (session history, user preferences)
            
        Returns:
            RouteDecision with agent routing information
        """
        if self.is_mock:
            return self._mock_route_decision(user_query)
        
        try:
            prompt = f"User message: {user_query}"
            if context:
                prompt += f"\nContext: {json.dumps(context)}"
            
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=self.INTENT_DETECTION_PROMPT,
                    response_mime_type="application/json"
                )
            )
            
            result = json.loads(response.text)
            
            return RouteDecision(
                primary_agent=AgentType(result.get("primary_agent", "general").lower()),
                secondary_agents=[AgentType(a.lower()) for a in result.get("secondary_agents", [])],
                confidence=result.get("confidence", 0.8),
                reasoning=result.get("reasoning", ""),
                extracted_params=result.get("extracted_params", {})
            )
            
        except Exception as e:
            logger.exception(f"Intent detection error: {e}")
            return self._fallback_route(user_query)
    
    async def route_request(
        self,
        user_query: str,
        context: Dict = None,
        force_agent: AgentType = None
    ) -> OrchestratorResponse:
        """
        Main entry point - routes request to appropriate agent(s).
        
        Args:
            user_query: User's message
            context: Session context
            force_agent: Optional - force routing to specific agent
            
        Returns:
            OrchestratorResponse with combined results
        """
        reasoning_chain = []
        
        # Step 1: Detect intent (or use forced agent)
        if force_agent:
            route = RouteDecision(
                primary_agent=force_agent,
                secondary_agents=[],
                confidence=1.0,
                reasoning="Forced by user/API",
                extracted_params={}
            )
            reasoning_chain.append(f"Using forced agent: {force_agent.value}")
        else:
            route = await self.detect_intent(user_query, context)
            reasoning_chain.append(f"Detected intent: {route.primary_agent.value} (confidence: {route.confidence:.2f})")
            reasoning_chain.append(f"Reasoning: {route.reasoning}")
        
        # Step 2: Execute primary agent
        agent_results = {}
        try:
            primary_result = await self._execute_agent(
                route.primary_agent,
                user_query,
                route.extracted_params,
                context
            )
            agent_results[route.primary_agent.value] = primary_result
            reasoning_chain.append(f"Executed {route.primary_agent.value} agent")
            
        except Exception as e:
            logger.error(f"Primary agent failed: {e}")
            agent_results["error"] = str(e)
            reasoning_chain.append(f"Primary agent error: {e}")
        
        # Step 3: Execute secondary agents if needed
        for secondary in route.secondary_agents:
            try:
                sec_result = await self._execute_agent(
                    secondary,
                    user_query,
                    route.extracted_params,
                    context
                )
                agent_results[secondary.value] = sec_result
                reasoning_chain.append(f"Executed secondary agent: {secondary.value}")
            except Exception as e:
                logger.warning(f"Secondary agent {secondary} failed: {e}")
        
        # Step 4: Format final response
        content = self._format_response(route.primary_agent, agent_results)
        
        return OrchestratorResponse(
            content=content,
            agent_used=route.primary_agent,
            agent_results=agent_results,
            reasoning_chain=reasoning_chain,
            metadata={
                "confidence": route.confidence,
                "secondary_agents": [a.value for a in route.secondary_agents],
                "params": route.extracted_params
            }
        )
    
    async def _execute_agent(
        self,
        agent_type: AgentType,
        query: str,
        params: Dict,
        context: Dict = None
    ) -> Dict[str, Any]:
        """Execute a specific agent."""
        
        if agent_type == AgentType.DESIGN:
            from services.design_agent import get_design_agent
            agent = get_design_agent()
            return await agent.generate_design(query)
        
        elif agent_type == AgentType.DIAGNOSTIC:
            # Use existing function executor
            from services.function_executor import execute_function
            return await execute_function("analyze_circuit", {
                "components": params.get("components", []),
                "supply_voltage": params.get("supply_voltage", 5.0),
                "issue_description": query,
                "circuit_type": params.get("circuit_type", "unknown")
            })
        
        elif agent_type == AgentType.SIMULATION:
            from services.simulation_agent import get_simulation_agent
            agent = get_simulation_agent()
            return await agent.simulate(query)
        
        elif agent_type == AgentType.CODE:
            from services.code_generator import generate_code
            return generate_code(
                project_description=query,
                board=params.get("board_type", "esp32"),
                components=params.get("components")
            )
        
        elif agent_type == AgentType.VISION:
            # Vision agent will be implemented next
            return {"status": "vision_agent_pending", "message": "Vision analysis requested"}
        
        elif agent_type == AgentType.COMPONENT:
            from services.component_service import search_components
            components = params.get("components", [])
            search_term = components[0] if components else query[:50]
            return search_components(search_term)
        
        else:  # GENERAL
            if self.is_mock:
                return self._get_general_response(query)
            
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=query,
                config=types.GenerateContentConfig(
                    system_instruction="You are an electronics expert. Answer clearly and accurately."
                )
            )
            return {"content": response.text}
    
    def _get_general_response(self, query: str) -> Dict[str, Any]:
        """Generate intelligent general electronics response."""
        query_lower = query.lower()
        
        if any(w in query_lower for w in ["resistor", "ohm", "resistance"]):
            return {"content": """## Understanding Resistors

**Resistors** are passive components that resist the flow of electric current.

### Key Formulas
- **Ohm's Law**: V = I × R
- **Power**: P = I²R = V²/R

### Color Code (4-Band)
| Band 1 | Band 2 | Multiplier | Tolerance |
|--------|--------|------------|-----------|
| 1st digit | 2nd digit | ×10^n | ±% |

**Example**: Brown-Black-Red-Gold = 10 × 100 = 1kΩ ±5%

### Common Applications
- Current limiting for LEDs
- Voltage dividers
- Pull-up/pull-down resistors
- RC timing circuits"""}
        
        elif any(w in query_lower for w in ["capacitor", "capacitance", "farad"]):
            return {"content": """## Understanding Capacitors

**Capacitors** store electrical energy in an electric field.

### Key Formulas
- **Charge**: Q = C × V
- **Energy**: E = ½CV²
- **Time Constant**: τ = R × C

### Types
| Type | Characteristics | Use Case |
|------|----------------|----------|
| Ceramic | Small, non-polar | Decoupling, RF |
| Electrolytic | Large, polarized | Power filtering |
| Tantalum | Stable, polarized | Precision circuits |
| Film | Low ESR | Audio, timing |

### Common Values
- 100nF (0.1µF) - Universal decoupling
- 10µF - Power supply filtering
- 22pF - Crystal oscillator loading"""}
        
        elif any(w in query_lower for w in ["led", "diode"]):
            return {"content": """## LED Circuit Design

### Basic LED Circuit
```
Vcc ──[R]──►│──GND
     Resistor  LED
```

### Resistor Calculation
**R = (Vcc - Vf) / If**

Where:
- Vcc = Supply voltage
- Vf = LED forward voltage (typically 1.8-3.3V)
- If = LED forward current (typically 20mA)

### Example (5V supply, Red LED)
R = (5V - 2.0V) / 20mA = **150Ω**

### LED Specifications
| Color | Vf (typical) | Wavelength |
|-------|-------------|------------|
| Red | 1.8-2.2V | 620-645nm |
| Green | 2.0-3.0V | 520-535nm |
| Blue | 3.0-3.5V | 460-490nm |
| White | 3.0-3.5V | Broad spectrum |"""}
        
        else:
            return {"content": f"""## Electronics Assistant

I can help you with a wide range of electronics topics:

**Your Question:** {query[:200]}...

### Quick Reference

**Common Formulas:**
- Ohm's Law: V = IR
- Power: P = IV = I²R = V²/R
- Capacitor Charge: τ = RC
- Inductor Response: τ = L/R

**Need Specific Help?**
Try asking about:
- Circuit design (LED, sensors, motors)
- Component selection
- Troubleshooting problems
- Code for Arduino/ESP32

**Specialized Agents Available:**
- 🎨 **Design Agent** - Create new circuits
- 🔧 **Diagnostic Agent** - Debug problems
- 📊 **Simulation Agent** - Run SPICE analysis
- 💻 **Code Agent** - Generate firmware
- 👁️ **Vision Agent** - Analyze PCB images

Just describe what you need in more detail!"""}
    
    def _format_response(self, agent_type: AgentType, results: Dict) -> str:
        """Format agent results into readable response."""
        primary_result = results.get(agent_type.value, {})
        
        if isinstance(primary_result, dict):
            if "content" in primary_result:
                return primary_result["content"]
            elif "error" in primary_result:
                return f"Error: {primary_result['error']}"
            else:
                return json.dumps(primary_result, indent=2)
        
        return str(primary_result)
    
    def _mock_route_decision(self, query: str) -> RouteDecision:
        """Mock routing for testing without API."""
        query_lower = query.lower()
        
        if any(w in query_lower for w in ["design", "create", "build", "make"]):
            agent = AgentType.DESIGN
        elif any(w in query_lower for w in ["debug", "fix", "not working", "problem"]):
            agent = AgentType.DIAGNOSTIC
        elif any(w in query_lower for w in ["simulate", "frequency", "bode"]):
            agent = AgentType.SIMULATION
        elif any(w in query_lower for w in ["code", "arduino", "esp32", "firmware"]):
            agent = AgentType.CODE
        elif any(w in query_lower for w in ["image", "photo", "picture", "pcb image"]):
            agent = AgentType.VISION
        elif any(w in query_lower for w in ["component", "part", "datasheet"]):
            agent = AgentType.COMPONENT
        else:
            agent = AgentType.GENERAL
        
        return RouteDecision(
            primary_agent=agent,
            secondary_agents=[],
            confidence=0.7,
            reasoning="Mock classification based on keywords",
            extracted_params={}
        )
    
    def _fallback_route(self, query: str) -> RouteDecision:
        """Fallback routing when API fails."""
        return self._mock_route_decision(query)


# Singleton instance
_orchestrator_instance: Optional[OrchestratorAgent] = None


def get_orchestrator_agent() -> OrchestratorAgent:
    """Get or create Orchestrator Agent instance."""
    global _orchestrator_instance
    if not _orchestrator_instance:
        _orchestrator_instance = OrchestratorAgent()
    return _orchestrator_instance
