from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    case_id: int
    amount: float
    description: Optional[str] = None


class PaymentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    case_id: int
    user_id: int
    amount: float
    description: Optional[str]
    status: PaymentStatus
    hyp_redirect_url: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime


class PaymentWebhook(BaseModel):
    transaction_id: str
    status: str
    amount: float
    merchant_id: str
