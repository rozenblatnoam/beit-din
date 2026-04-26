"""Inbox / Action Items — surface what needs the principal's attention."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.case import Case, CaseStatus
from app.models.dayan import Dayan
from app.models.lawyer import Lawyer
from app.models.notification import Notification
from app.models.schedule import Schedule

router = APIRouter(prefix="/inbox", tags=["inbox"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.get("/")
def get_inbox(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    role = payload.get("role") or "user"
    principal_id = int(payload.get("sub"))
    items: list[dict] = []
    now = datetime.now(timezone.utc)
    week_ahead = now + timedelta(days=7)

    if role == "dayan":
        # Hearings in the next 7 days
        upcoming = db.query(Schedule).filter(
            Schedule.dayan_id == principal_id,
            Schedule.scheduled_at >= now,
            Schedule.scheduled_at <= week_ahead,
        ).order_by(Schedule.scheduled_at).all()
        for s in upcoming:
            items.append({
                "type": "hearing",
                "icon": "calendar",
                "title": s.label or "דיון",
                "subtitle": f"תיק #{s.case_id}",
                "due": s.scheduled_at.isoformat() if s.scheduled_at else None,
                "link": "/dayan/portal",
            })
        # Cases without next_hearing scheduled
        unscheduled = db.query(Case).filter(
            Case.dayan_id == principal_id,
            Case.next_hearing.is_(None),
            Case.status != CaseStatus.closed,
        ).limit(5).all()
        for c in unscheduled:
            items.append({
                "type": "case",
                "icon": "alert",
                "title": "לקבוע דיון",
                "subtitle": f"{c.case_number} — {c.subject}",
                "link": "/dayan/portal",
            })

    elif role == "lawyer":
        upcoming = db.query(Schedule).join(Case, Schedule.case_id == Case.id).filter(
            Case.lawyer_id == principal_id,
            Schedule.scheduled_at >= now,
            Schedule.scheduled_at <= week_ahead,
        ).order_by(Schedule.scheduled_at).all()
        for s in upcoming:
            case = db.query(Case).filter(Case.id == s.case_id).first()
            items.append({
                "type": "hearing",
                "icon": "calendar",
                "title": s.label or "דיון",
                "subtitle": case.case_number if case else f"תיק #{s.case_id}",
                "due": s.scheduled_at.isoformat() if s.scheduled_at else None,
                "link": "/lawyer/portal",
            })
        # Cases without lawyer-uploaded docs (representative needs to act)
        # Skipping for now — just pull cases with status=docs (incomplete docs)
        active = db.query(Case).filter(
            Case.lawyer_id == principal_id,
            Case.status == CaseStatus.docs,
        ).limit(5).all()
        for c in active:
            items.append({
                "type": "case",
                "icon": "doc",
                "title": "הגש מסמכים",
                "subtitle": f"{c.case_number} — {c.subject}",
                "link": "/lawyer/portal",
            })

    else:
        # Regular user / admin
        my_cases = db.query(Case).filter(Case.user_id == principal_id).all()
        for c in my_cases:
            if c.status == CaseStatus.docs:
                items.append({
                    "type": "case",
                    "icon": "doc",
                    "title": "תיק ממתין למסמכים",
                    "subtitle": f"{c.case_number} — {c.subject}",
                    "link": "/documents",
                })
            if c.status == CaseStatus.pending:
                items.append({
                    "type": "case",
                    "icon": "clock",
                    "title": "תיק ממתין לתגובה",
                    "subtitle": f"{c.case_number} — {c.subject}",
                    "link": "/dashboard",
                })
            if c.next_hearing and c.next_hearing >= now and c.next_hearing <= week_ahead:
                items.append({
                    "type": "hearing",
                    "icon": "calendar",
                    "title": "דיון קרוב",
                    "subtitle": f"{c.case_number} — {c.subject}",
                    "due": c.next_hearing.isoformat(),
                    "link": "/dashboard",
                })

    # Unread notifications count for the principal
    notif_q = db.query(Notification).filter(Notification.is_read == False)  # noqa: E712
    if role == "dayan":
        notif_q = notif_q.filter(Notification.recipient_dayan_id == principal_id)
    elif role == "lawyer":
        notif_q = notif_q.filter(Notification.recipient_lawyer_id == principal_id)
    else:
        notif_q = notif_q.filter(Notification.recipient_user_id == principal_id)
    unread_notifs = notif_q.count()

    return {
        "unread_notifications": unread_notifs,
        "items": items[:20],
    }
