from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import get_settings
from app.models.case import Case
from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentOut, PaymentWebhook
from app.services import hyp, email as email_service

router = APIRouter(prefix="/payments", tags=["payments"])
settings = get_settings()


@router.post("/", response_model=PaymentOut, status_code=201)
def create_payment(body: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == body.case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    payment = Payment(
        case_id=body.case_id,
        user_id=current_user.id,
        amount=body.amount,
        description=body.description,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    result = hyp.create_payment(
        amount=float(body.amount),
        case_number=case.case_number,
        description=body.description or f"תשלום עבור תיק {case.case_number}",
        callback_url=f"{settings.BACKEND_URL}/payments/webhook",
        success_url=f"{settings.FRONTEND_URL}/payment/success",
        fail_url=f"{settings.FRONTEND_URL}/payment/fail",
    )

    payment.hyp_transaction_id = result.get("transaction_id")
    payment.hyp_redirect_url = result.get("redirect_url")
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/my", response_model=list[PaymentOut])
def list_my_payments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    transaction_id = data.get("TransactionId") or data.get("transaction_id")
    if not transaction_id:
        return {"ok": False}

    payment = db.query(Payment).filter(Payment.hyp_transaction_id == transaction_id).first()
    if not payment:
        return {"ok": False}

    tx_status = data.get("Status") or data.get("status", "")
    if tx_status in ("success", "Success", "approved"):
        payment.status = PaymentStatus.paid
        payment.paid_at = datetime.now(timezone.utc)
        db.commit()

        user = db.query(User).filter(User.id == payment.user_id).first()
        case = db.query(Case).filter(Case.id == payment.case_id).first()
        if user and case:
            email_service.send_payment_confirmed(user.email, user.name, float(payment.amount), case.case_number)
    elif tx_status in ("failed", "Failed", "error"):
        payment.status = PaymentStatus.failed
        db.commit()

    return {"ok": True}
