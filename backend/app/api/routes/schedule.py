from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_dayan, require_admin
from app.models.schedule import Schedule, DayanAvailability
from app.models.dayan import Dayan
from app.models.case import Case
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleOut
from app.schemas.dayan import AvailabilityUpdate, AvailabilityOut
from app.services import email as email_service
from app.services import events as events_service
from app.services import notifications as notif_service
from app.services.jewish_calendar import check_date
from app.models.user import User
import json

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/dayan/my", response_model=list[ScheduleOut])
def get_my_schedule(db: Session = Depends(get_db), current_dayan: Dayan = Depends(get_current_dayan)):
    return db.query(Schedule).filter(Schedule.dayan_id == current_dayan.id).order_by(Schedule.scheduled_at).all()


@router.get("/dayan/my/cases", response_model=list[dict])
def get_my_cases(db: Session = Depends(get_db), current_dayan: Dayan = Depends(get_current_dayan)):
    from app.models.case import CaseStatus
    cases = db.query(Case).filter(Case.dayan_id == current_dayan.id).order_by(Case.opened_at.desc()).all()
    status_labels = {CaseStatus.open: "פעיל", CaseStatus.pending: "ממתין לתגובה", CaseStatus.docs: "השלמת מסמכים", CaseStatus.closed: "נסגר"}
    return [
        {
            "id": c.id, "case_number": c.case_number, "subject": c.subject,
            "status": c.status.value, "status_label": status_labels.get(c.status, c.status.value),
            "amount": float(c.amount) if c.amount else None,
            "next_hearing": c.next_hearing.isoformat() if c.next_hearing else None,
            "opened_at": c.opened_at.isoformat() if c.opened_at else None,
        }
        for c in cases
    ]


@router.get("/dayan/my/availability", response_model=AvailabilityOut)
def get_my_availability(db: Session = Depends(get_db), current_dayan: Dayan = Depends(get_current_dayan)):
    avail = db.query(DayanAvailability).filter(DayanAvailability.dayan_id == current_dayan.id).first()
    if not avail:
        avail = DayanAvailability(dayan_id=current_dayan.id, days="[]", time_start="09:00", time_end="17:00", notes="")
        db.add(avail)
        db.commit()
        db.refresh(avail)
    return avail


@router.put("/availability", response_model=AvailabilityOut)
def update_availability(body: AvailabilityUpdate, db: Session = Depends(get_db), current_dayan: Dayan = Depends(get_current_dayan)):
    avail = db.query(DayanAvailability).filter(DayanAvailability.dayan_id == current_dayan.id).first()
    if not avail:
        avail = DayanAvailability(dayan_id=current_dayan.id)
        db.add(avail)

    if body.days is not None:
        avail.days = json.dumps(body.days)
    if body.time_start is not None:
        avail.time_start = body.time_start
    if body.time_end is not None:
        avail.time_end = body.time_end
    if body.notes is not None:
        avail.notes = body.notes

    db.commit()
    db.refresh(avail)
    return avail


@router.get("/availability/{dayan_id}", response_model=AvailabilityOut)
def get_availability(dayan_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    avail = db.query(DayanAvailability).filter(DayanAvailability.dayan_id == dayan_id).first()
    if not avail:
        raise HTTPException(status_code=404, detail="זמינות לא הוגדרה")
    return avail


@router.post("/", response_model=ScheduleOut, status_code=201)
def create_hearing(body: ScheduleCreate, force: bool = False, db: Session = Depends(get_db), admin=Depends(require_admin)):
    case = db.query(Case).filter(Case.id == body.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    blocked = check_date(body.scheduled_at)
    if blocked and not force:
        raise HTTPException(
            status_code=400,
            detail=f"לא ניתן לקבוע דיון בתאריך זה ({blocked}). שלח force=true כדי לעקוף.",
        )

    hearing = Schedule(**body.model_dump())
    db.add(hearing)

    case.next_hearing = body.scheduled_at
    db.commit()
    db.refresh(hearing)

    user = db.query(User).filter(User.id == case.user_id).first()
    if user:
        email_service.send_hearing_reminder(user.email, user.name, case.case_number, str(body.scheduled_at))

    events_service.add_event(
        db, case.id, "hearing_scheduled",
        title=f"נקבע {body.type or 'דיון'}",
        description=f"מועד: {body.scheduled_at}. {body.label or ''}",
        actor_type="admin",
    )
    if user:
        notif_service.notify_user(
            db, user.id,
            title="נקבע דיון בתיק", body=f"דיון בתיק {case.case_number} נקבע ל-{body.scheduled_at}.",
            link="/dashboard", case_id=case.id,
        )
    if hearing.dayan_id:
        notif_service.notify_dayan(
            db, hearing.dayan_id,
            title="נקבע דיון", body=f"נקבע דיון לתיק {case.case_number} ב-{body.scheduled_at}.",
            link="/dayan/portal", case_id=case.id,
        )
    if case.lawyer_id:
        notif_service.notify_lawyer(
            db, case.lawyer_id,
            title="נקבע דיון בתיק", body=f"דיון בתיק {case.case_number} נקבע ל-{body.scheduled_at}.",
            link="/lawyer/portal", case_id=case.id,
        )

    return hearing


@router.delete("/{hearing_id}", status_code=204)
def delete_hearing(hearing_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    hearing = db.query(Schedule).filter(Schedule.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="דיון לא נמצא")
    db.delete(hearing)
    db.commit()


@router.get("/check-date")
def check_hearing_date(date: str, _=Depends(require_admin)):
    """Check if a date is a Shabbat / Yom Tov / fast day. Returns {blocked: str|null}."""
    from datetime import datetime
    try:
        dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="פורמט תאריך לא תקין")
    return {"blocked": check_date(dt)}
