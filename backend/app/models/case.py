from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, func, Enum
from app.core.database import Base
import enum


class CaseStatus(str, enum.Enum):
    open = "open"
    pending = "pending"
    docs = "docs"
    closed = "closed"


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=False)
    subject = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(CaseStatus), default=CaseStatus.open, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dayan_id  = Column(Integer, ForeignKey("dayans.id"), nullable=True)  # אב"ד
    dayan2_id = Column(Integer, ForeignKey("dayans.id"), nullable=True)  # דיין ב'
    dayan3_id = Column(Integer, ForeignKey("dayans.id"), nullable=True)  # דיין ג'
    lawyer_id = Column(Integer, ForeignKey("lawyers.id"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=True)
    next_hearing = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
