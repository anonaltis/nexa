
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import Project, ProjectCreate, ProjectUpdate
from auth_utils import get_current_user
from db import db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[Project])
async def get_projects(current_user: str = Depends(get_current_user)):
    try:
        if db.db is not None:
            projects = await db.db.projects.find({"user_id": current_user}).to_list(1000)
            return projects
    except Exception as e:
        print(f"DB Error fetching projects: {e}")
        
    # Mock data for demo user if DB is down
    if current_user == "demo@example.com":
        return [
            {
                "id": "mock-1",
                "name": "Smart Temperature Monitor (Offline Mode)",
                "description": "An IoT device that monitors temperature. (Database is currently offline)",
                "category": "iot",
                "status": "completed",
                "tags": ["esp32", "dht22"],
                "user_id": current_user,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
    
    raise HTTPException(status_code=503, detail="Database is currently unavailable")

@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate, current_user: str = Depends(get_current_user)):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database is unavailable. Cannot create projects.")
        
    try:
        new_project = project.dict()
        new_project["user_id"] = current_user
        new_project["created_at"] = datetime.utcnow()
        new_project["updated_at"] = datetime.utcnow()
        
        result = await db.db.projects.insert_one(new_project)
        created_project = await db.db.projects.find_one({"_id": result.inserted_id})
        return created_project
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=Project)
async def get_project(id: str, current_user: str = Depends(get_current_user)):
    if db.db is None:
         # Simplified check for demo mock IDs
         if id.startswith("mock-"):
              return {
                "id": id,
                "name": "Mock Project",
                "description": "Database is offline",
                "category": "other",
                "status": "planning",
                "tags": [],
                "user_id": current_user,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
         raise HTTPException(status_code=503, detail="Database is unavailable")

    try:
        project = await db.db.projects.find_one({"_id": ObjectId(id), "user_id": current_user})
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=Project)
async def update_project(id: str, project_update: ProjectUpdate, current_user: str = Depends(get_current_user)):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database is unavailable")
        
    update_data = {k: v for k, v in project_update.dict().items() if v is not None}
    
    if len(update_data) >= 1:
        update_data["updated_at"] = datetime.utcnow()
        update_result = await db.db.projects.update_one(
            {"_id": ObjectId(id), "user_id": current_user},
            {"$set": update_data}
        )
        if update_result.modified_count == 0:
             # Check if it exists but wasn't updated (not found or no change)
             existing = await db.db.projects.find_one({"_id": ObjectId(id), "user_id": current_user})
             if not existing:
                 raise HTTPException(status_code=404, detail="Project not found")
    
    if (len(update_data) == 0):
         existing = await db.db.projects.find_one({"_id": ObjectId(id), "user_id": current_user})
         if not existing:
            raise HTTPException(status_code=404, detail="Project not found")
         return existing

    updated_project = await db.db.projects.find_one({"_id": ObjectId(id)})
    return updated_project

@router.delete("/{id}")
async def delete_project(id: str, current_user: str = Depends(get_current_user)):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database is unavailable")
        
    delete_result = await db.db.projects.delete_one({"_id": ObjectId(id), "user_id": current_user})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}
