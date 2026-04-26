"""Case event service — emit timeline entries for case actions."""
from sqlalchemy.orm import Session
from typing import Optional
from app.models.case_event import CaseEvent


def add_event(
    db: Session,
    case_id: int,
    event_type: str,
    title: str,
    description: Optional[str] = None,
    actor_type: Optional[str] = None,
    actor_id: Optional[int] = None,
) -> CaseEvent:
    e = CaseEvent(
        case_id=case_id,
        event_type=event_type,
        title=title,
        description=description,
        actor_type=actor_type,
        actor_id=actor_id,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e
