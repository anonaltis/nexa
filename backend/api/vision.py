"""
Vision API Router

Endpoints for image analysis of PCBs and schematics.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import logging
import base64

from services.vision_agent import (
    get_vision_agent,
    AnalysisType,
    VisionAnalysisResult
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/vision", tags=["vision"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class Base64ImageRequest(BaseModel):
    """Request with base64 encoded image."""
    image_data: str = Field(..., description="Base64 encoded image (with or without data URL prefix)")
    analysis_type: str = Field(default="general", description="Type: component_extraction, schematic_to_netlist, pcb_defect_detection, circuit_recognition, general")
    mime_type: str = Field(default="image/jpeg", description="Image MIME type")
    context: Optional[str] = Field(None, description="Additional context for analysis")


class VisionResponse(BaseModel):
    """Response from vision analysis."""
    analysis_type: str
    components: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]
    issues: List[Dict[str, Any]]
    description: str
    confidence: float
    metadata: Dict[str, Any]


class ComponentExtractionResponse(BaseModel):
    """Response for component extraction."""
    components: List[Dict[str, Any]]
    board_info: Optional[Dict[str, Any]]
    confidence: float


class DefectDetectionResponse(BaseModel):
    """Response for PCB defect detection."""
    defects: List[Dict[str, Any]]
    overall_quality: str
    recommendations: List[str]
    confidence: float


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/analyze", response_model=VisionResponse)
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    analysis_type: str = Form(default="general", description="Type of analysis")
) -> VisionResponse:
    """
    Analyze an uploaded image.
    
    Supported analysis types:
    - component_extraction: Extract components from PCB photo
    - schematic_to_netlist: Convert schematic to connections
    - pcb_defect_detection: Find manufacturing defects
    - circuit_recognition: Identify circuit function
    - general: General analysis
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Must be an image."
            )
        
        # Read image bytes
        image_bytes = await file.read()
        
        # Parse analysis type
        try:
            analysis_enum = AnalysisType(analysis_type.lower())
        except ValueError:
            analysis_enum = AnalysisType.GENERAL
        
        # Analyze
        vision_agent = get_vision_agent()
        result: VisionAnalysisResult = await vision_agent.analyze_image(
            image_data=image_bytes,
            analysis_type=analysis_enum,
            mime_type=file.content_type
        )
        
        return VisionResponse(
            analysis_type=result.analysis_type.value,
            components=result.components,
            connections=result.connections,
            issues=result.issues,
            description=result.description,
            confidence=result.confidence,
            metadata=result.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Vision analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-base64", response_model=VisionResponse)
async def analyze_base64_image(request: Base64ImageRequest) -> VisionResponse:
    """
    Analyze a base64 encoded image.
    Useful for frontend canvas data or embedded images.
    """
    try:
        # Parse analysis type
        try:
            analysis_enum = AnalysisType(request.analysis_type.lower())
        except ValueError:
            analysis_enum = AnalysisType.GENERAL
        
        # Analyze
        vision_agent = get_vision_agent()
        result = await vision_agent.analyze_image_from_base64(
            base64_data=request.image_data,
            analysis_type=analysis_enum,
            mime_type=request.mime_type,
            additional_context=request.context
        )
        
        return VisionResponse(
            analysis_type=result.analysis_type.value,
            components=result.components,
            connections=result.connections,
            issues=result.issues,
            description=result.description,
            confidence=result.confidence,
            metadata=result.metadata
        )
        
    except Exception as e:
        logger.exception(f"Base64 vision analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-components", response_model=ComponentExtractionResponse)
async def extract_components(
    file: UploadFile = File(..., description="PCB or circuit image")
) -> ComponentExtractionResponse:
    """
    Quick endpoint for component extraction.
    Optimized for identifying components in PCB photos.
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Must be an image file")
        
        image_bytes = await file.read()
        vision_agent = get_vision_agent()
        result = await vision_agent.extract_components(image_bytes, file.content_type)
        
        return ComponentExtractionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Component extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-issues", response_model=DefectDetectionResponse)
async def detect_pcb_issues(
    file: UploadFile = File(..., description="PCB image to check for defects")
) -> DefectDetectionResponse:
    """
    Detect manufacturing or assembly defects in PCB image.
    
    Detects:
    - Solder bridges
    - Cold solder joints
    - Missing components
    - Tombstoning
    - Polarity issues
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Must be an image file")
        
        image_bytes = await file.read()
        vision_agent = get_vision_agent()
        result = await vision_agent.detect_pcb_issues(image_bytes, file.content_type)
        
        return DefectDetectionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Defect detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schematic-to-netlist")
async def schematic_to_netlist(
    file: UploadFile = File(..., description="Schematic image")
) -> Dict[str, Any]:
    """
    Convert schematic image to netlist format.
    
    Returns component list and connection data.
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Must be an image file")
        
        image_bytes = await file.read()
        vision_agent = get_vision_agent()
        result = await vision_agent.schematic_to_netlist(image_bytes, file.content_type)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Schematic conversion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis-types")
async def list_analysis_types() -> Dict[str, Any]:
    """List all available analysis types."""
    return {
        "analysis_types": [
            {
                "id": "component_extraction",
                "name": "Component Extraction",
                "description": "Extract components from PCB or circuit images",
                "use_case": "Identify parts in a circuit photo"
            },
            {
                "id": "schematic_to_netlist",
                "name": "Schematic to Netlist",
                "description": "Convert schematic diagram to connection data",
                "use_case": "Import schematic from image"
            },
            {
                "id": "pcb_defect_detection",
                "name": "PCB Defect Detection",
                "description": "Find manufacturing/assembly defects",
                "use_case": "Quality check before powering on"
            },
            {
                "id": "circuit_recognition",
                "name": "Circuit Recognition",
                "description": "Identify circuit type and function",
                "use_case": "Understand unknown circuit"
            },
            {
                "id": "general",
                "name": "General Analysis",
                "description": "General electronics image analysis",
                "use_case": "Any electronics-related image"
            }
        ]
    }
