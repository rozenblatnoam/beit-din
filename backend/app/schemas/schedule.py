from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.schedule import HearingType


class ScheduleCreate(BaseModel):
    case_id: int
    dayan_id: int
    scheduled_at: datetime
    type: HearingType = HearingType.hearing
    label: Optional[str] = None
    notes: Optional[str] = None


class ScheduleUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    type: Optional[HearingType] = None
    label: Optional[str] = None
    notes: Optional[str] = None


class ScheduleOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    case_id: int
    dayan_id: int
    scheduled_at: datetime
    type: HearingType
    label: Optional[str]
    notes: Optional[str]
    created_at: datetime
