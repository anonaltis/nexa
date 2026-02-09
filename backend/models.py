
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        json_schema = handler(core_schema)
        json_schema.update(type="string")
        return json_schema

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class User(UserBase):
    id: Optional[str] = Field(default=None, alias="_id")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "other"
    tags: List[str] = []
    status: str = "planning"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class Project(ProjectBase):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Chat Session Models
class ChatMessageModel(BaseModel):
    id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = None

class ChatSessionBase(BaseModel):
    title: Optional[str] = "New Chat"
    project_id: Optional[str] = None

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    project_id: Optional[str] = None

class ChatSession(ChatSessionBase):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    messages: List[ChatMessageModel] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Component Database Models
class ComponentSpec(BaseModel):
    name: str
    value: Optional[str] = None
    package: Optional[str] = None
    manufacturer: Optional[str] = None
    datasheet_url: Optional[str] = None
    purchase_url: Optional[str] = None
    price: Optional[float] = None

class ComponentBase(BaseModel):
    name: str
    category: str  # resistor, capacitor, ic, mcu, sensor, connector, etc.
    description: Optional[str] = None
    specs: Optional[ComponentSpec] = None
    pinout: Optional[dict] = None
    footprint: Optional[str] = None
    symbol: Optional[str] = None
    tags: List[str] = []

class ComponentCreate(ComponentBase):
    pass

class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    specs: Optional[ComponentSpec] = None
    pinout: Optional[dict] = None
    footprint: Optional[str] = None
    symbol: Optional[str] = None
    tags: Optional[List[str]] = None

class Component(ComponentBase):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Schematic Models
class SchematicNode(BaseModel):
    id: str
    component_id: Optional[str] = None
    x: float
    y: float
    rotation: float = 0
    properties: dict = Field(default_factory=dict)

class SchematicWire(BaseModel):
    id: str
    from_node: str
    from_pin: str
    to_node: str
    to_pin: str
    points: List[dict] = []  # List of {x, y} waypoints

class SchematicBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: Optional[str] = None

class SchematicCreate(SchematicBase):
    nodes: Optional[List[SchematicNode]] = []
    wires: Optional[List[SchematicWire]] = []

class SchematicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[SchematicNode]] = None
    wires: Optional[List[SchematicWire]] = None

class Schematic(SchematicBase):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    nodes: List[SchematicNode] = []
    wires: List[SchematicWire] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
