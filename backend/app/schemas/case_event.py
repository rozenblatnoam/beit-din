from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CaseEventOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    case_id: int
    event_type: str
    title: str
    description: Optional[str]
    actor_type: Optional[str]
    actor_id: Optional[int]
    created_at: datetime
