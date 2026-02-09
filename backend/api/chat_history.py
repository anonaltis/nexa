
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import uuid

from auth_utils import get_current_user
from db import db
from models import ChatSession, ChatSessionCreate, ChatSessionUpdate, ChatMessageModel

router = APIRouter()

# Helper to serialize MongoDB documents
def serialize_session(session: dict) -> dict:
    if session:
        session["_id"] = str(session["_id"])
    return session

# Create a new chat session
@router.post("/sessions", response_model=dict)
async def create_session(
    session_data: ChatSessionCreate,
    current_user: str = Depends(get_current_user)
):
    print(f"DEBUG: Creating session for user {current_user} with title: {session_data.title}")
    session = {
        "title": session_data.title or "New Chat",
        "project_id": session_data.project_id,
        "user_id": current_user,
        "messages": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.db["chat_sessions"].insert_one(session)
    session["_id"] = str(result.inserted_id)

    return serialize_session(session)

# List all sessions for current user
@router.get("/sessions", response_model=List[dict])
async def list_sessions(
    current_user: str = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    cursor = db.db["chat_sessions"].find(
        {"user_id": current_user}
    ).sort("updated_at", -1).skip(skip).limit(limit)

    sessions = await cursor.to_list(length=limit)

    # Return summary (without full messages for list view)
    result = []
    for s in sessions:
        result.append({
            "_id": str(s["_id"]),
            "title": s.get("title", "New Chat"),
            "project_id": s.get("project_id"),
            "message_count": len(s.get("messages", [])),
            "created_at": s.get("created_at"),
            "updated_at": s.get("updated_at"),
            "preview": s.get("messages", [{}])[0].get("content", "")[:100] if s.get("messages") else ""
        })

    return result

# Get a single session with all messages
@router.get("/sessions/{session_id}", response_model=dict)
async def get_session(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    try:
        session = await db.db["chat_sessions"].find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return serialize_session(session)

# Update session (title, project_id)
@router.put("/sessions/{session_id}", response_model=dict)
async def update_session(
    session_id: str,
    update_data: ChatSessionUpdate,
    current_user: str = Depends(get_current_user)
):
    try:
        session = await db.db["chat_sessions"].find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_dict = {"updated_at": datetime.utcnow()}
    if update_data.title is not None:
        update_dict["title"] = update_data.title
    if update_data.project_id is not None:
        update_dict["project_id"] = update_data.project_id

    await db.db["chat_sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_dict}
    )

    session = await db.db["chat_sessions"].find_one({"_id": ObjectId(session_id)})
    return serialize_session(session)

# Delete a session
@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    try:
        result = await db.db["chat_sessions"].delete_one({
            "_id": ObjectId(session_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session deleted successfully"}

# Add a message to a session
class AddMessageRequest(BaseModel):
    role: str
    content: str
    metadata: Optional[dict] = None

@router.post("/sessions/{session_id}/messages", response_model=dict)
async def add_message(
    session_id: str,
    message_data: AddMessageRequest,
    current_user: str = Depends(get_current_user)
):
    try:
        session = await db.db["chat_sessions"].find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    message = {
        "id": str(uuid.uuid4()),
        "role": message_data.role,
        "content": message_data.content,
        "timestamp": datetime.utcnow(),
        "metadata": message_data.metadata
    }

    # Auto-generate title from first user message if title is still default
    update_dict = {
        "updated_at": datetime.utcnow()
    }

    if session.get("title") == "New Chat" and message_data.role == "user":
        # Use first 50 chars of first user message as title
        update_dict["title"] = message_data.content[:50] + ("..." if len(message_data.content) > 50 else "")

    await db.db["chat_sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {"messages": message},
            "$set": update_dict
        }
    )

    return message

# Delete a message from a session
@router.delete("/sessions/{session_id}/messages/{message_id}")
async def delete_message(
    session_id: str,
    message_id: str,
    current_user: str = Depends(get_current_user)
):
    try:
        result = await db.db["chat_sessions"].update_one(
            {
                "_id": ObjectId(session_id),
                "user_id": current_user
            },
            {
                "$pull": {"messages": {"id": message_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid request parameters")

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found or already deleted")

    return {"message": "Message deleted successfully"}
