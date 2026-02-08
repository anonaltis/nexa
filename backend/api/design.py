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
    components: Optional[List[str]] = None
    board_size: Optional[Dict[str, int]] = None
    use_cache: bool = True


class DesignResponse(BaseModel):
    """Response from design generation."""
    content: str
    metadata: Dict[str, Any]
    is_cached: bool = False


@router.post("/generate", response_model=DesignResponse)
async def generate_design(request: DesignRequest):
    """
    Generate a circuit design or PCB layout.
    
    This endpoint uses the Design Agent which has:
    - Separate API key (DESIGN_AGENT_API_KEY)
    - Response caching
    - Dual-agent validation (Generator + Validator)
    
    Example requests:
    - "Design a 5V power supply using LM7805"
    - "Create a PCB for LED blinker circuit"
    - "Design a temperature monitoring system with ESP32"
    """
    try:
        agent = get_design_agent()
        result = await agent.generate_design(
            user_query=request.query,
            use_cache=request.use_cache
        )
        
        return DesignResponse(
            content=result.get("content", ""),
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
