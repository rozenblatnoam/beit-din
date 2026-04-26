from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.case import Case
from app.models.case_event import CaseEvent
from app.schemas.case_event import CaseEventOut

router = APIRouter(prefix="/cases", tags=["case-events"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _user_can_view_case(db: Session, case: Case, role: str, principal_id: int) -> bool:
    if role == "dayan":
        return case.dayan_id == principal_id
    if role == "lawyer":
        return case.lawyer_id == principal_id
    # default: regular user / admin
    from app.models.user import User
    user = db.query(User).filter(User.id == principal_id).first()
    if not user:
        return False
    if user.is_admin:
        return True
    return case.user_id == principal_id


@router.get("/{case_id}/events", response_model=list[CaseEventOut])
def list_case_events(
    case_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    payload = decode_token(token)
    role = payload.get("role") or "user"
    principal_id = int(payload.get("sub"))
    if not _user_can_view_case(db, case, role, principal_id):
        raise HTTPException(status_code=403, detail="אין הרשאה לצפות באירועי התיק")

    return db.query(CaseEvent).filter(CaseEvent.case_id == case_id).order_by(CaseEvent.created_at.desc()).all()
