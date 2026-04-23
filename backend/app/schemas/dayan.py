from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class DayanCreate(BaseModel):
    email: EmailStr
    name: str
    short_name: Optional[str] = None
    specialty: Optional[str] = None
    avatar: Optional[str] = None
    password: str


class DayanUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    specialty: Optional[str] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None


class DayanOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    email: str
    name: str
    short_name: Optional[str]
    specialty: Optional[str]
    avatar: Optional[str]
    is_active: bool
    created_at: datetime


class DayanLogin(BaseModel):
    email: EmailStr
    password: str


class DayanTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    dayan: DayanOut


class AvailabilityUpdate(BaseModel):
    days: Optional[list[int]] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    notes: Optional[str] = None


class AvailabilityOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    dayan_id: int
    days: Optional[str]
    time_start: Optional[str]
    time_end: Optional[str]
    notes: Optional[str]
