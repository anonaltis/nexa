
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from auth_utils import get_current_user
from db import db
from models import Schematic, SchematicCreate, SchematicUpdate, SchematicNode, SchematicWire

router = APIRouter()


class SchematicResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    project_id: Optional[str]
    user_id: str
    nodes: List[Dict[str, Any]]
    wires: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


@router.get("/", response_model=List[Dict[str, Any]])
async def list_schematics(
    project_id: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """List all schematics for current user, optionally filtered by project."""
    query = {"user_id": current_user}
    if project_id:
        query["project_id"] = project_id

    cursor = db.db["schematics"].find(query).sort("updated_at", -1)
    schematics = await cursor.to_list(length=100)

    for s in schematics:
        s["_id"] = str(s["_id"])

    return schematics


@router.post("/", response_model=Dict[str, Any])
async def create_schematic(
    schematic: SchematicCreate,
    current_user: str = Depends(get_current_user)
):
    """Create a new schematic."""
    schematic_dict = {
        "name": schematic.name,
        "description": schematic.description,
        "project_id": schematic.project_id,
        "user_id": current_user,
        "nodes": [],
        "wires": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.db["schematics"].insert_one(schematic_dict)
    schematic_dict["_id"] = str(result.inserted_id)

    return schematic_dict


@router.get("/{schematic_id}", response_model=Dict[str, Any])
async def get_schematic(
    schematic_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get a single schematic by ID."""
    try:
        schematic = await db.db["schematics"].find_one({
            "_id": ObjectId(schematic_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid schematic ID")

    if not schematic:
        raise HTTPException(status_code=404, detail="Schematic not found")

    schematic["_id"] = str(schematic["_id"])
    return schematic


@router.put("/{schematic_id}", response_model=Dict[str, Any])
async def update_schematic(
    schematic_id: str,
    update_data: SchematicUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update a schematic."""
    try:
        existing = await db.db["schematics"].find_one({
            "_id": ObjectId(schematic_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid schematic ID")

    if not existing:
        raise HTTPException(status_code=404, detail="Schematic not found")

    update_dict = {"updated_at": datetime.utcnow()}

    if update_data.name is not None:
        update_dict["name"] = update_data.name
    if update_data.description is not None:
        update_dict["description"] = update_data.description
    if update_data.nodes is not None:
        update_dict["nodes"] = [n.dict() for n in update_data.nodes]
    if update_data.wires is not None:
        update_dict["wires"] = [w.dict() for w in update_data.wires]

    await db.db["schematics"].update_one(
        {"_id": ObjectId(schematic_id)},
        {"$set": update_dict}
    )

    schematic = await db.db["schematics"].find_one({"_id": ObjectId(schematic_id)})
    schematic["_id"] = str(schematic["_id"])
    return schematic


@router.delete("/{schematic_id}")
async def delete_schematic(
    schematic_id: str,
    current_user: str = Depends(get_current_user)
):
    """Delete a schematic."""
    try:
        result = await db.db["schematics"].delete_one({
            "_id": ObjectId(schematic_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid schematic ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schematic not found")

    return {"message": "Schematic deleted successfully"}


class AnalyzeSchematicRequest(BaseModel):
    nodes: List[Dict[str, Any]]
    wires: List[Dict[str, Any]]


@router.post("/{schematic_id}/analyze")
async def analyze_schematic(
    schematic_id: str,
    current_user: str = Depends(get_current_user)
):
    """Analyze a schematic circuit."""
    try:
        schematic = await db.db["schematics"].find_one({
            "_id": ObjectId(schematic_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid schematic ID")

    if not schematic:
        raise HTTPException(status_code=404, detail="Schematic not found")

    # Basic analysis - count components and connections
    nodes = schematic.get("nodes", [])
    wires = schematic.get("wires", [])

    component_types = {}
    for node in nodes:
        comp_type = node.get("properties", {}).get("type", "unknown")
        component_types[comp_type] = component_types.get(comp_type, 0) + 1

    return {
        "schematic_id": schematic_id,
        "component_count": len(nodes),
        "connection_count": len(wires),
        "component_types": component_types,
        "analysis": "Basic component count analysis. Full circuit analysis coming soon."
    }


class ConvertToPCBRequest(BaseModel):
    board_width: int = 100
    board_height: int = 80


@router.post("/{schematic_id}/to-pcb")
async def convert_to_pcb(
    schematic_id: str,
    request: ConvertToPCBRequest,
    current_user: str = Depends(get_current_user)
):
    """Convert a schematic to PCB layout."""
    try:
        schematic = await db.db["schematics"].find_one({
            "_id": ObjectId(schematic_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid schematic ID")

    if not schematic:
        raise HTTPException(status_code=404, detail="Schematic not found")

    # Extract components from schematic
    nodes = schematic.get("nodes", [])
    components = []

    for node in nodes:
        props = node.get("properties", {})
        components.append({
            "id": node.get("id"),
            "name": props.get("label", "Unknown"),
            "package": props.get("package", "GENERIC"),
            "x": node.get("x", 0) / 4,  # Scale down for PCB
            "y": node.get("y", 0) / 4,
            "rotation": node.get("rotation", 0),
            "layer": "top"
        })

    return {
        "schematic_id": schematic_id,
        "components": components,
        "board": {
            "width": request.board_width,
            "height": request.board_height
        },
        "message": "Components extracted. Use PCB generator for full layout."
    }
