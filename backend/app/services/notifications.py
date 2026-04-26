"""Notification service — create in-app notifications for users/dayans/lawyers."""
from sqlalchemy.orm import Session
from typing import Optional
from app.models.notification import Notification


def notify_user(db: Session, user_id: int, title: str, body: Optional[str] = None,
                link: Optional[str] = None, case_id: Optional[int] = None) -> Notification:
    n = Notification(
        recipient_user_id=user_id, title=title, body=body, link=link, related_case_id=case_id,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def notify_dayan(db: Session, dayan_id: int, title: str, body: Optional[str] = None,
                 link: Optional[str] = None, case_id: Optional[int] = None) -> Notification:
    n = Notification(
        recipient_dayan_id=dayan_id, title=title, body=body, link=link, related_case_id=case_id,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def notify_lawyer(db: Session, lawyer_id: int, title: str, body: Optional[str] = None,
                  link: Optional[str] = None, case_id: Optional[int] = None) -> Notification:
    n = Notification(
        recipient_lawyer_id=lawyer_id, title=title, body=body, link=link, related_case_id=case_id,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
