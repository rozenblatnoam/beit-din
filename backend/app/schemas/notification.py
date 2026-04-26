from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    title: str
    body: Optional[str]
    link: Optional[str]
    related_case_id: Optional[int]
    is_read: bool
    created_at: datetime


class UnreadCount(BaseModel):
    count: int
