from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.case import Case
from app.models.user import User
from app.schemas.case import CaseCreate, CaseOut
from app.services import email as email_service
from app.services import events as events_service
from app.services import notifications as notif_service

router = APIRouter(prefix="/cases", tags=["cases"])


def _generate_case_number(db: Session) -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"{year}-"
    last = (
        db.query(Case.case_number)
        .filter(Case.case_number.like(f"{prefix}%"))
        .order_by(Case.case_number.desc())
        .first()
    )
    if last:
        try:
            num = int(last[0].replace(prefix, "")) + 1
        except ValueError:
            num = 1
    else:
        num = 1
    return f"{year}-{num:03d}"


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
    events_service.add_event(
        db, case.id, "case_opened",
        title=f"תיק נפתח", description=f"תיק {case.case_number} נפתח על ידי {current_user.name}",
        actor_type="user", actor_id=current_user.id,
    )
    notif_service.notify_user(
        db, current_user.id,
        title="תיק חדש נפתח", body=f"תיק מספר {case.case_number} נפתח בהצלחה במערכת.",
        link=f"/dashboard", case_id=case.id,
    )
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
