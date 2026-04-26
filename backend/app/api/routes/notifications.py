from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import decode_token
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, UnreadCount

router = APIRouter(prefix="/notifications", tags=["notifications"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _scope_query(token: str, db: Session):
    """Return a query filtered to the current authenticated principal's notifications."""
    payload = decode_token(token)
    role = payload.get("role")
    sub = int(payload.get("sub"))
    q = db.query(Notification)
    if role == "dayan":
        return q.filter(Notification.recipient_dayan_id == sub)
    if role == "lawyer":
        return q.filter(Notification.recipient_lawyer_id == sub)
    return q.filter(Notification.recipient_user_id == sub)


@router.get("/", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    q = _scope_query(token, db)
    if unread_only:
        q = q.filter(Notification.is_read == False)  # noqa: E712
    return q.order_by(Notification.created_at.desc()).limit(limit).all()


@router.get("/unread-count", response_model=UnreadCount)
def unread_count(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    q = _scope_query(token, db).filter(Notification.is_read == False)  # noqa: E712
    return UnreadCount(count=q.count())


@router.post("/{notif_id}/read", response_model=NotificationOut)
def mark_read(notif_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    n = _scope_query(token, db).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="התראה לא נמצאה")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.post("/read-all", status_code=204)
def mark_all_read(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _scope_query(token, db).filter(Notification.is_read == False).update(  # noqa: E712
        {Notification.is_read: True}, synchronize_session=False
    )
    db.commit()
