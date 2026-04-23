from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.case import CaseStatus


class CaseCreate(BaseModel):
    subject: str
    description: Optional[str] = None
    amount: Optional[float] = None


class CaseUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    dayan_id: Optional[int] = None
    amount: Optional[float] = None
    next_hearing: Optional[datetime] = None


class CaseOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    case_number: str
    subject: str
    description: Optional[str]
    status: CaseStatus
    user_id: int
    dayan_id: Optional[int]
    amount: Optional[float]
    next_hearing: Optional[datetime]
    opened_at: datetime
    updated_at: datetime
