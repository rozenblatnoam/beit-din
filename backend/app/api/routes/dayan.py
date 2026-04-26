"""Dayan-only routes — case detail, protocols, document/audio upload."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_dayan
from app.models.case import Case
from app.models.dayan import Dayan
from app.models.user import User
from app.models.protocol import CaseProtocol
from app.models.document import Document
from app.schemas.protocol import ProtocolCreate, ProtocolUpdate, ProtocolOut
from app.schemas.document import DocumentOut
from app.services import google_drive
from app.services import events as events_service
from app.services import notifications as notif_service

router = APIRouter(prefix="/dayan", tags=["dayan"])

ALLOWED_DOC_TYPES = {
    "application/pdf", "image/jpeg", "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    # Audio formats for hearing recordings
    "audio/webm", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-wav", "audio/mp4",
}
MAX_SIZE_MB = 100  # audio files can be large


def _ensure_assigned(db: Session, case_id: int, dayan_id: int) -> Case:
    case = db.query(Case).filter(Case.id == case_id, Case.dayan_id == dayan_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא או לא משובץ אליך")
    return case


# ─── Protocols ─────────────────────────────────────────

@router.get("/cases/{case_id}/protocols", response_model=list[ProtocolOut])
def list_protocols(case_id: int, db: Session = Depends(get_db), dayan: Dayan = Depends(get_current_dayan)):
    _ensure_assigned(db, case_id, dayan.id)
    return db.query(CaseProtocol).filter(CaseProtocol.case_id == case_id).order_by(CaseProtocol.updated_at.desc()).all()


@router.post("/cases/{case_id}/protocols", response_model=ProtocolOut, status_code=201)
def create_protocol(
    case_id: int, body: ProtocolCreate,
    db: Session = Depends(get_db), dayan: Dayan = Depends(get_current_dayan),
):
    case = _ensure_assigned(db, case_id, dayan.id)
    type_label = "פרוטוקול דיון" if body.type == "hearing_protocol" else "פסק דין"
    doc_name = body.title or f"{type_label} - {case.case_number}"

    drive_file_id = None
    drive_edit_url = None
    if google_drive.is_configured():
        try:
            drive_data = google_drive.create_google_doc(doc_name, case.case_number)
            drive_file_id = drive_data["drive_file_id"]
            drive_edit_url = drive_data["drive_edit_url"]
        except Exception:
            # Drive failed — fall back to in-DB content editor
            pass

    p = CaseProtocol(
        case_id=case_id, type=body.type, title=body.title or "",
        content=body.content or "", author_dayan_id=dayan.id,
        drive_file_id=drive_file_id, drive_edit_url=drive_edit_url,
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    events_service.add_event(
        db, case_id, "protocol_created",
        title=f"{type_label} נוצר",
        description=p.title or type_label,
        actor_type="dayan", actor_id=dayan.id,
    )
    notif_service.notify_user(
        db, case.user_id,
        title=f"{type_label} נוצר", body=f"דיין יצר {type_label} בתיק {case.case_number}",
        link="/dashboard", case_id=case_id,
    )
    if case.lawyer_id:
        notif_service.notify_lawyer(
            db, case.lawyer_id,
            title=f"{type_label} נוצר", body=f"דיין יצר {type_label} בתיק {case.case_number}",
            link="/lawyer/portal", case_id=case_id,
        )
    return p


@router.put("/protocols/{protocol_id}", response_model=ProtocolOut)
def update_protocol(
    protocol_id: int, body: ProtocolUpdate,
    db: Session = Depends(get_db), dayan: Dayan = Depends(get_current_dayan),
):
    p = db.query(CaseProtocol).filter(CaseProtocol.id == protocol_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="מסמך לא נמצא")
    # Only the assigned dayan of the case can edit
    case = db.query(Case).filter(Case.id == p.case_id).first()
    if not case or case.dayan_id != dayan.id:
        raise HTTPException(status_code=403, detail="אין הרשאה לערוך")

    if body.title is not None:
        p.title = body.title
    if body.content is not None:
        p.content = body.content
    db.commit()
    db.refresh(p)
    return p


@router.delete("/protocols/{protocol_id}", status_code=204)
def delete_protocol(protocol_id: int, db: Session = Depends(get_db), dayan: Dayan = Depends(get_current_dayan)):
    p = db.query(CaseProtocol).filter(CaseProtocol.id == protocol_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="מסמך לא נמצא")
    case = db.query(Case).filter(Case.id == p.case_id).first()
    if not case or case.dayan_id != dayan.id:
        raise HTTPException(status_code=403, detail="אין הרשאה למחוק")
    db.delete(p)
    db.commit()


# ─── Documents (uploads, including audio) ─────────────

@router.get("/cases/{case_id}/documents", response_model=list[DocumentOut])
def list_case_documents(case_id: int, db: Session = Depends(get_db), dayan: Dayan = Depends(get_current_dayan)):
    _ensure_assigned(db, case_id, dayan.id)
    return db.query(Document).filter(Document.case_id == case_id).order_by(Document.uploaded_at.desc()).all()


@router.post("/cases/{case_id}/documents", response_model=DocumentOut, status_code=201)
def upload_document(
    case_id: int, file: UploadFile = File(...),
    db: Session = Depends(get_db), dayan: Dayan = Depends(get_current_dayan),
):
    case = _ensure_assigned(db, case_id, dayan.id)

    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"סוג קובץ לא נתמך: {file.content_type}")

    content = file.file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"הקובץ גדול מ-{MAX_SIZE_MB}MB")
    file.file.seek(0)

    drive_data = google_drive.upload_file(file, case.case_number)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    is_audio = file.content_type.startswith("audio/")
    doc = Document(
        name=file.filename,
        case_id=case_id,
        uploaded_by_dayan_id=dayan.id,
        file_type="audio" if is_audio else ext,
        size_bytes=drive_data["size_bytes"],
        drive_file_id=drive_data["drive_file_id"],
        drive_view_url=drive_data["drive_view_url"],
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    label = "הקלטה" if is_audio else "מסמך"
    events_service.add_event(
        db, case_id, "document_uploaded",
        title=f"הועלה{' אודיו' if is_audio else ''} ע\"י דיין",
        description=file.filename,
        actor_type="dayan", actor_id=dayan.id,
    )
    notif_service.notify_user(
        db, case.user_id,
        title=f"{label} חדש{'ה' if is_audio else ''} בתיק", body=f"דיין הוסיף {label} לתיק {case.case_number}",
        link="/dashboard", case_id=case_id,
    )
    return doc


@router.delete("/documents/{doc_id}", status_code=204)
def delete_own_document(doc_id: int, db: Session = Depends(get_db), dayan: Dayan = Depends(get_current_dayan)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.uploaded_by_dayan_id == dayan.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="מסמך לא נמצא")
    if doc.drive_file_id:
        google_drive.delete_file(doc.drive_file_id)
    db.delete(doc)
    db.commit()
