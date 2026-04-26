from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class ProtocolCreate(BaseModel):
    type: Literal["hearing_protocol", "verdict"]
    title: Optional[str] = None
    content: str = ""


class ProtocolUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class ProtocolOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    case_id: int
    type: str
    title: Optional[str]
    content: str
    drive_file_id: Optional[str] = None
    drive_edit_url: Optional[str] = None
    author_dayan_id: Optional[int]
    created_at: datetime
    updated_at: datetime
