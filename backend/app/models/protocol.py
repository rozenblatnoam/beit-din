from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.core.database import Base


class CaseProtocol(Base):
    """A written document attached to a case — hearing protocol or verdict.
    Stored as text/markdown directly in the DB (unlike Document, which stores files in Drive)."""
    __tablename__ = "case_protocols"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # "hearing_protocol" | "verdict"
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False, default="")
    author_dayan_id = Column(Integer, ForeignKey("dayans.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
