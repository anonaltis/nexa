
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from auth_utils import get_current_user
from db import db
from services.pcb_generator import generate_pcb, generate_svg, generate_bom, get_component_library

router = APIRouter()


class PCBGenerationRequest(BaseModel):
    components: List[str]
    connections: Optional[List[Dict[str, str]]] = None
    board_size: Optional[Dict[str, int]] = None
    project_description: Optional[str] = None
    project_id: Optional[str] = None


class PCBSaveRequest(BaseModel):
    pcb_data: Dict[str, Any]
    svg: str
    name: Optional[str] = "Untitled PCB"


class BOMItem(BaseModel):
    reference: str
    name: str
    package: str
    quantity: int


class PCBGenerationResponse(BaseModel):
    pcb_data: Dict[str, Any]
    svg: str
    bom: List[BOMItem]
    generated_at: datetime


@router.post("/generate", response_model=PCBGenerationResponse)
async def generate_pcb_layout(
    request: PCBGenerationRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Generate a PCB layout from components and connections.
    """
    try:
        result = await generate_pcb(
            components=request.components,
            connections=request.connections,
            board_size=request.board_size,
            project_description=request.project_description
        )

        return {
            "pcb_data": result.get("pcb_data", {}),
            "svg": result.get("svg", ""),
            "bom": result.get("bom", []),
            "generated_at": datetime.utcnow()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PCB generation failed: {str(e)}")


@router.get("/{project_id}")
async def get_pcb(
    project_id: str,
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get saved PCB for a project.
    """
    try:
        pcb = await db.db["pcb_designs"].find_one({
            "project_id": project_id,
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid project ID")

    if not pcb:
        raise HTTPException(status_code=404, detail="PCB not found")

    pcb["_id"] = str(pcb["_id"])
    return pcb


@router.put("/{project_id}")
async def save_pcb(
    project_id: str,
    request: PCBSaveRequest,
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Save or update PCB for a project.
    """
    pcb_data = {
        "project_id": project_id,
        "user_id": current_user,
        "pcb_data": request.pcb_data,
        "svg": request.svg,
        "name": request.name,
        "updated_at": datetime.utcnow()
    }

    # Upsert - update if exists, insert if not
    result = await db.db["pcb_designs"].update_one(
        {"project_id": project_id, "user_id": current_user},
        {"$set": pcb_data, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True
    )

    # Get the updated/inserted document
    pcb = await db.db["pcb_designs"].find_one({
        "project_id": project_id,
        "user_id": current_user
    })

    if pcb:
        pcb["_id"] = str(pcb["_id"])

    return pcb


@router.post("/export/svg")
async def export_svg(
    pcb_data: Dict[str, Any],
    current_user: str = Depends(get_current_user)
) -> Response:
    """
    Export PCB as SVG.
    """
    try:
        svg_content = generate_svg(pcb_data)
        return Response(
            content=svg_content,
            media_type="image/svg+xml",
            headers={"Content-Disposition": "attachment; filename=pcb_design.svg"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SVG export failed: {str(e)}")


@router.post("/export/bom")
async def export_bom(
    pcb_data: Dict[str, Any],
    current_user: str = Depends(get_current_user)
) -> List[BOMItem]:
    """
    Export Bill of Materials.
    """
    try:
        bom = generate_bom(pcb_data)
        return bom
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BOM export failed: {str(e)}")


@router.get("/components/library")
async def get_components_library(
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get available component library for PCB design.
    """
    return get_component_library()
