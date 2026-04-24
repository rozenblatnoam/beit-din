from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_by_dayan_id = Column(Integer, ForeignKey("dayans.id"), nullable=True)
    uploaded_by_lawyer_id = Column(Integer, ForeignKey("lawyers.id"), nullable=True)
    file_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    drive_file_id = Column(String, nullable=True)
    drive_view_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
