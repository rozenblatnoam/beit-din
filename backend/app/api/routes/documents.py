import os
import re
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.case import Case
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentOut
from app.services import google_drive
from app.services import events as events_service
from app.services import notifications as notif_service

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm", "audio/aac",
    "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo",
}
MAX_SIZE_MB = 200

# Local upload directory (relative to where uvicorn runs → /opt/dinlink/backend/uploads in prod)
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "uploads"))


def _safe_filename(name: str) -> str:
    return re.sub(r"[^\w.\-]", "_", name)


def _save_locally(content: bytes, case_number: str, filename: str) -> tuple[str, str]:
    """Save file to disk. Returns (local_path, view_url)."""
    folder = UPLOADS_DIR / _safe_filename(case_number)
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / _safe_filename(filename)
    # Avoid overwrites
    if dest.exists():
        stem, suffix = dest.stem, dest.suffix
        dest = folder / f"{stem}_{os.urandom(4).hex()}{suffix}"
    dest.write_bytes(content)
    return str(dest), None  # view_url set after doc is saved (needs doc.id)


@router.post("/", response_model=DocumentOut, status_code=201)
def upload_document(
    case_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך")

    content = file.file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"הקובץ גדול מ-{MAX_SIZE_MB}MB")
    file.file.seek(0)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    if google_drive.is_configured():
        drive_data = google_drive.upload_file(file, case.case_number)
        doc = Document(
            name=file.filename, case_id=case_id,
            uploaded_by_user_id=current_user.id,
            file_type=ext,
            size_bytes=drive_data["size_bytes"],
            drive_file_id=drive_data["drive_file_id"],
            drive_view_url=drive_data["drive_view_url"],
        )
    else:
        local_path, _ = _save_locally(content, case.case_number, file.filename)
        doc = Document(
            name=file.filename, case_id=case_id,
            uploaded_by_user_id=current_user.id,
            file_type=ext,
            size_bytes=len(content),
            drive_file_id=f"local:{local_path}",
            drive_view_url=None,
        )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Set local view URL now that we have doc.id
    if doc.drive_file_id and doc.drive_file_id.startswith("local:"):
        doc.drive_view_url = f"/documents/view/{doc.id}"
        db.commit()
        db.refresh(doc)

    events_service.add_event(
        db, case_id, "document_uploaded",
        title="הועלה מסמך", description=f"{file.filename}",
        actor_type="user", actor_id=current_user.id,
    )
    if case.dayan_id:
        notif_service.notify_dayan(
            db, case.dayan_id,
            title="מסמך חדש בתיק", body=f"הוגש מסמך חדש לתיק {case.case_number}: {file.filename}",
            link="/dayan/portal", case_id=case_id,
        )
    if case.lawyer_id:
        notif_service.notify_lawyer(
            db, case.lawyer_id,
            title="מסמך חדש בתיק", body=f"הוגש מסמך חדש לתיק {case.case_number}: {file.filename}",
            link="/lawyer/portal", case_id=case_id,
        )
    return doc


@router.get("/view/{doc_id}")
def view_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="מסמך לא נמצא")
    # Verify ownership via case
    case = db.query(Case).filter(Case.id == doc.case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=403, detail="אין גישה")
    if not doc.drive_file_id or not doc.drive_file_id.startswith("local:"):
        raise HTTPException(status_code=404, detail="קובץ לא נמצא מקומית")
    local_path = doc.drive_file_id[len("local:"):]
    if not Path(local_path).exists():
        raise HTTPException(status_code=404, detail="הקובץ נמחק מהשרת")
    return FileResponse(path=local_path, filename=doc.name, media_type="application/octet-stream")


@router.get("/case/{case_id}", response_model=list[DocumentOut])
def list_documents(case_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")
    return db.query(Document).filter(Document.case_id == case_id).all()


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.uploaded_by_user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="מסמך לא נמצא")
    if doc.drive_file_id:
        if doc.drive_file_id.startswith("local:"):
            local_path = Path(doc.drive_file_id[len("local:"):])
            if local_path.exists():
                local_path.unlink()
        else:
            google_drive.delete_file(doc.drive_file_id)
    db.delete(doc)
    db.commit()
