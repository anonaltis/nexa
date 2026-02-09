
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from auth_utils import get_current_user
from services.code_generator import generate_code, get_board_templates

router = APIRouter()


class CodeGenerationRequest(BaseModel):
    description: str
    board: str = "esp32"
    components: Optional[List[str]] = None
    features: Optional[List[str]] = None
    project_id: Optional[str] = None


class CodeFile(BaseModel):
    filename: str
    language: str
    content: str


class LibraryInfo(BaseModel):
    name: str
    version: Optional[str] = None
    manager: Optional[str] = None


class WiringInfo(BaseModel):
    component: str
    pin: str
    board_pin: str


class CodeGenerationResponse(BaseModel):
    files: List[CodeFile]
    libraries: List[LibraryInfo]
    wiring: List[WiringInfo]
    notes: Optional[str] = None
    generated_at: datetime


@router.post("/generate", response_model=CodeGenerationResponse)
async def generate_project_code(
    request: CodeGenerationRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Generate code for a project based on description and target board.
    """
    try:
        result = await generate_code(
            project_description=request.description,
            board=request.board,
            components=request.components,
            features=request.features
        )

        return {
            "files": result.get("files", []),
            "libraries": result.get("libraries", []),
            "wiring": result.get("wiring", []),
            "notes": result.get("notes"),
            "generated_at": datetime.utcnow()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")


@router.get("/templates")
async def get_templates(
    board: Optional[str] = None,
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get available board templates and their configurations.
    Optionally filter by board type.
    """
    templates = get_board_templates()

    if board:
        if board in templates:
            return {board: templates[board]}
        else:
            raise HTTPException(status_code=404, detail=f"Board '{board}' not found")

    return templates


@router.get("/templates/{board}")
async def get_template_by_board(
    board: str,
    current_user: str = Depends(get_current_user)
):
    """
    Get template configuration for a specific board.
    """
    templates = get_board_templates()

    if board not in templates:
        raise HTTPException(status_code=404, detail=f"Board '{board}' not found")

    return templates[board]


class CodeAnalysisRequest(BaseModel):
    code: str
    board: str = "esp32"
    context: Optional[str] = None


@router.post("/analyze")
async def analyze_project_code(
    request: CodeAnalysisRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Analyze firmware code for errors, safety, and efficiency.
    """
    try:
        from services.code_generator import analyze_code
        result = await analyze_code(
            code=request.code,
            board=request.board,
            context=request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code analysis failed: {str(e)}")
