from typing import List, Dict, Optional, Union
from pydantic import BaseModel

class Component(BaseModel):
    id: str
    type: str  # Resistor, OpAmp, etc.
    value: Optional[str] = None
    nodes: Union[List[str], Dict[str, str]]

class Supply(BaseModel):
    id: str
    type: str
    value: str
    node: str

class CircuitData(BaseModel):
    circuit_id: str
    description: Optional[str] = None
    components: List[Component]
    supplies: List[Supply]
    measured_outputs: Optional[Dict[str, str]] = None
