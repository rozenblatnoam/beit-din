from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Enum
from app.core.database import Base
import enum


class HearingType(str, enum.Enum):
    hearing = "hearing"
    review = "review"
    consultation = "consultation"


class Schedule(Base):
    __tablename__ = "schedule"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    dayan_id = Column(Integer, ForeignKey("dayans.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    type = Column(Enum(HearingType), default=HearingType.hearing, nullable=False)
    label = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DayanAvailability(Base):
    __tablename__ = "dayan_availability"

    id = Column(Integer, primary_key=True, index=True)
    dayan_id = Column(Integer, ForeignKey("dayans.id"), unique=True, nullable=False)
    days = Column(String, nullable=True)
    time_start = Column(String, nullable=True)
    time_end = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
