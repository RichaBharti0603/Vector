from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class AgentType(str, Enum):
    INTAKE = "intake"
    ROUTING = "routing"
    SCHEDULING = "scheduling"
    SECURITY = "security"
    ESCALATION = "escalation"
    MEMORY = "memory"

class EventPayload(BaseModel):
    id: str
    agent_type: AgentType
    priority: Priority
    message: str
    summary: str
    recommended_action: Optional[str] = None
    confidence_score: float = 1.0
    metadata: Dict[str, Any] = {}
