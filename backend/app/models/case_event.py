from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.core.database import Base


class CaseEvent(Base):
    __tablename__ = "case_events"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)  # case_opened, dayan_assigned, lawyer_assigned, document_uploaded, payment_received, status_changed, hearing_scheduled, note_added
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    actor_type = Column(String, nullable=True)  # "user" | "dayan" | "lawyer" | "admin" | "system"
    actor_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
