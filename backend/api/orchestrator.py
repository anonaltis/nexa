"""
Orchestrator API Router

Main entry point that routes requests to appropriate specialized agents.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import logging

from services.orchestrator_agent import (
    get_orchestrator_agent,
    AgentType,
    OrchestratorResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/orchestrator", tags=["orchestrator"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class RouteRequest(BaseModel):
    """Request for orchestrator routing."""
    query: str = Field(..., description="User's query or request")
    context: Dict[str, Any] = Field(default_factory=dict, description="Session context")
    force_agent: Optional[str] = Field(None, description="Force specific agent: design, diagnostic, simulation, code, vision, component")
    session_id: Optional[str] = Field(None, description="Session ID for history")


class RouteResponse(BaseModel):
    """Response from orchestrator."""
    content: str = Field(..., description="Agent response content")
    agent_used: str = Field(..., description="Which agent handled the request")
    reasoning_chain: List[str] = Field(default_factory=list, description="Reasoning steps")
    confidence: float = Field(0.8, description="Confidence score")
    agent_results: Dict[str, Any] = Field(default_factory=dict, description="Raw agent results")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class IntentRequest(BaseModel):
    """Request for intent detection only."""
    query: str = Field(..., description="User's query")
    context: Dict[str, Any] = Field(default_factory=dict)


class IntentResponse(BaseModel):
    """Intent detection response."""
    primary_agent: str
    secondary_agents: List[str]
    confidence: float
    reasoning: str
    extracted_params: Dict[str, Any]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/route", response_model=RouteResponse)
async def route_request(request: RouteRequest) -> RouteResponse:
    """
    Main orchestrator endpoint - routes to appropriate agent.
    
    Flow:
    1. Detect intent from user query
    2. Select best agent(s)
    3. Execute agent(s)
    4. Return unified response
    """
    try:
        orchestrator = get_orchestrator_agent()
        
        # Parse force_agent if provided
        force_agent = None
        if request.force_agent:
            try:
                force_agent = AgentType(request.force_agent.lower())
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid agent: {request.force_agent}. Valid: design, diagnostic, simulation, code, vision, component, general"
                )
        
        # Route the request
        result: OrchestratorResponse = await orchestrator.route_request(
            user_query=request.query,
            context=request.context,
            force_agent=force_agent
        )
        
        return RouteResponse(
            content=result.content,
            agent_used=result.agent_used.value,
            reasoning_chain=result.reasoning_chain,
            confidence=result.metadata.get("confidence", 0.8),
            agent_results=result.agent_results,
            metadata=result.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Orchestrator error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-intent", response_model=IntentResponse)
async def detect_intent(request: IntentRequest) -> IntentResponse:
    """
    Detect intent without executing any agent.
    Useful for UI to show which agent will handle the request.
    """
    try:
        orchestrator = get_orchestrator_agent()
        result = await orchestrator.detect_intent(request.query, request.context)
        
        return IntentResponse(
            primary_agent=result.primary_agent.value,
            secondary_agents=[a.value for a in result.secondary_agents],
            confidence=result.confidence,
            reasoning=result.reasoning,
            extracted_params=result.extracted_params
        )
        
    except Exception as e:
        logger.exception(f"Intent detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents")
async def list_agents() -> Dict[str, Any]:
    """List all available agents and their capabilities."""
    return {
        "agents": [
            {
                "id": "design",
                "name": "Design Agent",
                "description": "Creates circuit designs, schematics, and PCB layouts",
                "capabilities": ["circuit_design", "pcb_layout", "bom_generation"],
                "frontend_location": "Chat, Schematic"
            },
            {
                "id": "diagnostic",
                "name": "Diagnostic Agent",
                "description": "Troubleshoots and debugs circuit problems",
                "capabilities": ["fault_detection", "root_cause_analysis", "physics_validation"],
                "frontend_location": "Troubleshoot, Analyzer"
            },
            {
                "id": "simulation",
                "name": "Simulation Agent",
                "description": "Runs SPICE-level circuit simulations",
                "capabilities": ["bode_plot", "transient_analysis", "dc_operating_point"],
                "frontend_location": "Analyzer, PCB"
            },
            {
                "id": "code",
                "name": "Code Agent",
                "description": "Generates firmware code for microcontrollers",
                "capabilities": ["arduino_code", "esp32_code", "library_recommendations"],
                "frontend_location": "Code Editor"
            },
            {
                "id": "vision",
                "name": "Vision Agent",
                "description": "Analyzes PCB and schematic images",
                "capabilities": ["component_extraction", "pcb_defect_detection", "schematic_recognition"],
                "frontend_location": "PCB, Schematic"
            },
            {
                "id": "component",
                "name": "Component Agent",
                "description": "Searches and recommends electronic components",
                "capabilities": ["component_search", "datasheet_info", "alternative_suggestions"],
                "frontend_location": "Components"
            }
        ]
    }
