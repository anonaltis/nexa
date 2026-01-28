
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from auth_utils import get_current_user
from db import db
from models import Component, ComponentCreate, ComponentUpdate
from services.component_service import (
    seed_components,
    search_components,
    get_categories,
    suggest_components
)

router = APIRouter()


class ComponentSuggestRequest(BaseModel):
    description: str
    board: Optional[str] = None


@router.get("/", response_model=List[Dict[str, Any]])
async def list_components(
    q: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: str = Depends(get_current_user)
):
    """
    List and search components with filters.
    """
    tag_list = tags.split(",") if tags else None

    components = await search_components(
        db=db,
        query=q,
        category=category,
        tags=tag_list,
        skip=skip,
        limit=limit
    )

    return components


@router.get("/categories", response_model=List[Dict[str, Any]])
async def list_categories(
    current_user: str = Depends(get_current_user)
):
    """
    Get all component categories with counts.
    """
    return await get_categories(db)


@router.get("/seed")
async def seed_database(
    current_user: str = Depends(get_current_user)
):
    """
    Seed the database with initial components.
    """
    return await seed_components(db)


@router.get("/{component_id}", response_model=Dict[str, Any])
async def get_component(
    component_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get a single component by ID.
    """
    try:
        component = await db.db["components"].find_one({
            "_id": ObjectId(component_id)
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid component ID")

    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    component["_id"] = str(component["_id"])
    return component


@router.post("/", response_model=Dict[str, Any])
async def create_component(
    component: ComponentCreate,
    current_user: str = Depends(get_current_user)
):
    """
    Create a new component.
    """
    component_dict = component.dict()
    component_dict["created_at"] = datetime.utcnow()
    component_dict["updated_at"] = datetime.utcnow()

    result = await db.db["components"].insert_one(component_dict)
    component_dict["_id"] = str(result.inserted_id)

    return component_dict


@router.put("/{component_id}", response_model=Dict[str, Any])
async def update_component(
    component_id: str,
    update_data: ComponentUpdate,
    current_user: str = Depends(get_current_user)
):
    """
    Update a component.
    """
    try:
        existing = await db.db["components"].find_one({
            "_id": ObjectId(component_id)
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid component ID")

    if not existing:
        raise HTTPException(status_code=404, detail="Component not found")

    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    await db.db["components"].update_one(
        {"_id": ObjectId(component_id)},
        {"$set": update_dict}
    )

    component = await db.db["components"].find_one({"_id": ObjectId(component_id)})
    component["_id"] = str(component["_id"])
    return component


@router.delete("/{component_id}")
async def delete_component(
    component_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete a component.
    """
    try:
        result = await db.db["components"].delete_one({
            "_id": ObjectId(component_id)
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid component ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Component not found")

    return {"message": "Component deleted successfully"}


@router.post("/suggest", response_model=List[Dict[str, Any]])
async def suggest_components_for_project(
    request: ComponentSuggestRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Get AI-powered component suggestions based on project description.
    """
    return await suggest_components(
        db=db,
        project_description=request.description,
        board=request.board
    )
