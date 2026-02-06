"""
Simulation Agent API Routes

Provides endpoints for AI-powered circuit simulation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from services.simulation_agent import get_simulation_agent
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class SimulationRequest(BaseModel):
    """Request model for circuit simulation."""
    circuit_description: str
    simulation_type: str = "auto"  # "auto", "analog", "digital", "power"
    use_cache: bool = True


class SimulationResponse(BaseModel):
    """Response model for simulation results."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    circuit_type: str
    from_cache: bool = False
    is_mock: bool = False
    error: Optional[str] = None


@router.post("/run", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """
    Run AI-powered circuit simulation.
    
    Supports:
    - Analog circuits: Bode plots, frequency response
    - Digital circuits: Truth tables, timing analysis
    - Power circuits: Efficiency, thermal analysis
    """
    try:
        agent = get_simulation_agent()
        result = await agent.simulate(
            circuit_description=request.circuit_description,
            simulation_type=request.simulation_type,
            use_cache=request.use_cache
        )
        
        return SimulationResponse(
            success=result.get("success", False),
            data=result.get("data"),
            circuit_type=result.get("circuit_type", "unknown"),
            from_cache=result.get("from_cache", False),
            is_mock=result.get("is_mock", False),
            error=result.get("error")
        )
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def simulation_health():
    """Check Simulation Agent health status."""
    agent = get_simulation_agent()
    return {
        "status": "ok",
        "is_mock": agent.is_mock,
        "cache_size": len(agent._cache),
        "requests_in_window": len(agent._request_times)
    }
