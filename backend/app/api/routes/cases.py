from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.case import Case
from app.models.user import User
from app.schemas.case import CaseCreate, CaseOut
from app.services import email as email_service

router = APIRouter(prefix="/cases", tags=["cases"])


def _generate_case_number(db: Session) -> str:
    year = datetime.now(timezone.utc).year
    count = db.query(Case).filter(Case.case_number.like(f"{year}-%")).count()
    return f"{year}-{count + 1:03d}"


@router.post("/", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
def create_case(body: CaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = Case(
        case_number=_generate_case_number(db),
        subject=body.subject,
        description=body.description,
        amount=body.amount,
        user_id=current_user.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    email_service.send_case_opened(current_user.email, current_user.name, case.case_number)
    return case


@router.get("/", response_model=list[CaseOut])
def list_my_cases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Case).filter(Case.user_id == current_user.id).order_by(Case.opened_at.desc()).all()


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")
    return case
