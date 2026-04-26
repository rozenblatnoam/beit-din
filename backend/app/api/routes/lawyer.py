from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_lawyer
from app.models.case import Case
from app.models.document import Document
from app.models.user import User
from app.models.lawyer import Lawyer
from app.schemas.document import DocumentOut
from app.schemas.lawyer import LawyerCaseOut
from app.services import google_drive
from app.services import events as events_service
from app.services import notifications as notif_service

router = APIRouter(prefix="/lawyer", tags=["lawyer"])

ALLOWED_TYPES = {
    "application/pdf", "image/jpeg", "image/png", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_SIZE_MB = 20


def _case_to_out(case: Case, client: Optional[User]) -> dict:
    return {
        "id": case.id,
        "case_number": case.case_number,
        "subject": case.subject,
        "status": case.status.value if hasattr(case.status, "value") else case.status,
        "amount": float(case.amount) if case.amount is not None else None,
        "opened_at": case.opened_at,
        "next_hearing": case.next_hearing,
        "client_name": client.name if client else None,
        "client_email": client.email if client else None,
    }


@router.get("/search", response_model=list[LawyerCaseOut])
def search_cases(
    client: Optional[str] = Query(None, description="שם הלקוח (חיפוש חלקי)"),
    case_number: Optional[str] = Query(None, description="מספר תיק (חיפוש חלקי)"),
    db: Session = Depends(get_db),
    lawyer: Lawyer = Depends(get_current_lawyer),
):
    q = db.query(Case, User).join(User, Case.user_id == User.id).filter(Case.lawyer_id == lawyer.id)

    if case_number:
        q = q.filter(Case.case_number.ilike(f"%{case_number}%"))
    if client:
        q = q.filter(User.name.ilike(f"%{client}%"))

    results = q.order_by(Case.opened_at.desc()).all()
    return [_case_to_out(case, user) for case, user in results]


@router.get("/cases/{case_id}", response_model=LawyerCaseOut)
def get_case(case_id: int, db: Session = Depends(get_db), lawyer: Lawyer = Depends(get_current_lawyer)):
    case = db.query(Case).filter(Case.id == case_id, Case.lawyer_id == lawyer.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")
    user = db.query(User).filter(User.id == case.user_id).first()
    return _case_to_out(case, user)


@router.get("/cases/{case_id}/documents", response_model=list[DocumentOut])
def list_case_documents(case_id: int, db: Session = Depends(get_db), lawyer: Lawyer = Depends(get_current_lawyer)):
    case = db.query(Case).filter(Case.id == case_id, Case.lawyer_id == lawyer.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")
    return db.query(Document).filter(Document.case_id == case_id).order_by(Document.uploaded_at.desc()).all()


@router.post("/cases/{case_id}/documents", response_model=DocumentOut, status_code=201)
def upload_case_document(
    case_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    lawyer: Lawyer = Depends(get_current_lawyer),
):
    case = db.query(Case).filter(Case.id == case_id, Case.lawyer_id == lawyer.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך")

    content = file.file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"הקובץ גדול מ-{MAX_SIZE_MB}MB")
    file.file.seek(0)

    drive_data = google_drive.upload_file(file, case.case_number)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    doc = Document(
        name=file.filename,
        case_id=case_id,
        uploaded_by_lawyer_id=lawyer.id,
        file_type=ext,
        size_bytes=drive_data["size_bytes"],
        drive_file_id=drive_data["drive_file_id"],
        drive_view_url=drive_data["drive_view_url"],
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    events_service.add_event(
        db, case_id, "document_uploaded",
        title="הועלה מסמך ע\"י עו\"ד/טו\"ר", description=f"{file.filename}",
        actor_type="lawyer", actor_id=lawyer.id,
    )
    notif_service.notify_user(
        db, case.user_id,
        title="מסמך חדש בתיק", body=f"{lawyer.name} הוסיף מסמך לתיק {case.case_number}: {file.filename}",
        link="/dashboard", case_id=case_id,
    )
    if case.dayan_id:
        notif_service.notify_dayan(
            db, case.dayan_id,
            title="מסמך חדש בתיק", body=f"הוגש מסמך לתיק {case.case_number}: {file.filename}",
            link="/dayan/portal", case_id=case_id,
        )
    return doc


@router.delete("/documents/{doc_id}", status_code=204)
def delete_own_document(doc_id: int, db: Session = Depends(get_db), lawyer: Lawyer = Depends(get_current_lawyer)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.uploaded_by_lawyer_id == lawyer.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="מסמך לא נמצא")
    if doc.drive_file_id:
        google_drive.delete_file(doc.drive_file_id)
    db.delete(doc)
    db.commit()
