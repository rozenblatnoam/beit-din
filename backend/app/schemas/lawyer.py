from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Literal


class LawyerCreate(BaseModel):
    email: EmailStr
    name: str
    short_name: Optional[str] = None
    role: Optional[Literal["lawyer", "toen"]] = "lawyer"
    license_number: Optional[str] = None
    password: str


class LawyerUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    role: Optional[Literal["lawyer", "toen"]] = None
    license_number: Optional[str] = None
    is_active: Optional[bool] = None


class LawyerOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    email: str
    name: str
    short_name: Optional[str]
    role: Optional[str]
    license_number: Optional[str]
    is_active: bool
    created_at: datetime


class LawyerLogin(BaseModel):
    email: EmailStr
    password: str


class LawyerTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    lawyer: LawyerOut


class LawyerCaseOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    case_number: str
    subject: str
    status: str
    amount: Optional[float] = None
    opened_at: datetime
    next_hearing: Optional[datetime] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
