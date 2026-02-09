"""
Design API Router

Provides endpoints for circuit design and PCB generation.
Uses the Design Agent service (separate from Chat Agent).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from services.design_agent import get_design_agent

router = APIRouter(prefix="/api/design", tags=["design"])


class DesignRequest(BaseModel):
    """Request body for design generation."""
    query: str
    session_id: Optional[str] = None
    components: Optional[List[str]] = None
    board_size: Optional[Dict[str, int]] = None
    use_cache: bool = True


class DesignResponse(BaseModel):
    """Response from design generation."""
    content: str
    schematic: Optional[str] = None
    schematic_data: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any]
    is_cached: bool = False


@router.post("/generate", response_model=DesignResponse)
async def generate_design(request: DesignRequest):
    """
    Generate a circuit design or PCB layout and save to history if session_id is provided.
    """
    try:
        agent = get_design_agent()
        
        # Save user message if session exists
        if request.session_id:
            try:
                from services.memory_service import get_memory_service
                memory = get_memory_service()
                await memory.add_message(
                    session_id=request.session_id,
                    role="user",
                    content=request.query,
                    metadata={"agent": "design"}
                )
            except Exception as e:
                print(f"Failed to save user message: {e}")

        result = await agent.generate_design(
            user_query=request.query,
            use_cache=request.use_cache
        )
        
        # Save AI response if session exists
        if request.session_id:
            try:
                from services.memory_service import get_memory_service
                memory = get_memory_service()
                await memory.add_message(
                    session_id=request.session_id,
                    role="assistant",
                    content=result.get("content", ""),
                    metadata={
                        "agent": "design",
                        "pcb_data": result.get("pcb_data"),
                        "pcb_svg": result.get("pcb_svg"),
                        "bom": result.get("bom"),
                        "schematic_data": result.get("schematic_data"),
                        "firmware": result.get("metadata", {}).get("firmware"),
                        "simulation_results": result.get("metadata", {}).get("simulation_results"),
                        "validation_status": result.get("metadata", {}).get("validation_status")
                    }
                )
            except Exception as e:
                print(f"Failed to save AI response: {e}")

        return DesignResponse(
            content=result.get("content", ""),
            schematic=result.get("schematic", ""),
            schematic_data=result.get("schematic_data", None),
            metadata=result.get("metadata", {}),
            is_cached=result.get("is_cached", False)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check Design Agent status."""
    agent = get_design_agent()
    return {
        "status": "ok",
        "is_mock": agent.is_mock,
        "cache_size": len(agent._cache),
        "requests_in_window": len(agent._request_times)
    }
