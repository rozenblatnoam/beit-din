from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    # Polymorphic recipient: exactly one of these is set
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    recipient_dayan_id = Column(Integer, ForeignKey("dayans.id"), nullable=True, index=True)
    recipient_lawyer_id = Column(Integer, ForeignKey("lawyers.id"), nullable=True, index=True)

    title = Column(String, nullable=False)
    body = Column(String, nullable=True)
    link = Column(String, nullable=True)  # frontend route, e.g. "/dashboard?case=2026-0001"
    related_case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
