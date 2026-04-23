from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    case_id: int
    file_type: Optional[str]
    size_bytes: Optional[int]
    drive_view_url: Optional[str]
    uploaded_at: datetime
