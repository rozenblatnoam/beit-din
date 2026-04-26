from fastapi import APIRouter, Depends, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.case import Case
from app.models.dayan import Dayan
from app.models.lawyer import Lawyer
from app.models.document import Document

router = APIRouter(prefix="/search", tags=["search"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.get("/")
def unified_search(
    q: str = Query(..., min_length=1, description="חיפוש כללי"),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = decode_token(token)
    role = payload.get("role") or "user"
    principal_id = int(payload.get("sub"))

    like = f"%{q}%"
    cases = []
    documents = []
    people = []

    # Cases scoped by role
    case_q = db.query(Case, User).join(User, Case.user_id == User.id).filter(
        or_(
            Case.case_number.ilike(like),
            Case.subject.ilike(like),
            Case.description.ilike(like),
            User.name.ilike(like),
        )
    )
    if role == "dayan":
        case_q = case_q.filter(Case.dayan_id == principal_id)
    elif role == "lawyer":
        case_q = case_q.filter(Case.lawyer_id == principal_id)
    else:
        user = db.query(User).filter(User.id == principal_id).first()
        if not (user and user.is_admin):
            case_q = case_q.filter(Case.user_id == principal_id)

    for case, owner in case_q.order_by(Case.opened_at.desc()).limit(20).all():
        cases.append({
            "id": case.id, "case_number": case.case_number,
            "subject": case.subject, "client_name": owner.name,
            "status": case.status.value if hasattr(case.status, "value") else case.status,
            "opened_at": case.opened_at.isoformat() if case.opened_at else None,
        })

    # Documents — only those whose case the principal can view
    doc_q = db.query(Document, Case).join(Case, Document.case_id == Case.id).filter(Document.name.ilike(like))
    if role == "dayan":
        doc_q = doc_q.filter(Case.dayan_id == principal_id)
    elif role == "lawyer":
        doc_q = doc_q.filter(Case.lawyer_id == principal_id)
    else:
        user = db.query(User).filter(User.id == principal_id).first()
        if not (user and user.is_admin):
            doc_q = doc_q.filter(Case.user_id == principal_id)

    for doc, case in doc_q.order_by(Document.uploaded_at.desc()).limit(20).all():
        documents.append({
            "id": doc.id, "name": doc.name, "case_id": case.id, "case_number": case.case_number,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            "drive_view_url": doc.drive_view_url,
        })

    # People — admin only
    user_obj = db.query(User).filter(User.id == principal_id).first() if role == "user" else None
    is_admin = bool(user_obj and user_obj.is_admin)
    if is_admin:
        for u in db.query(User).filter(or_(User.name.ilike(like), User.email.ilike(like))).limit(10).all():
            people.append({"id": u.id, "type": "user", "name": u.name, "email": u.email})
        for d in db.query(Dayan).filter(or_(Dayan.name.ilike(like), Dayan.email.ilike(like))).limit(10).all():
            people.append({"id": d.id, "type": "dayan", "name": d.name, "email": d.email})
        for l in db.query(Lawyer).filter(or_(Lawyer.name.ilike(like), Lawyer.email.ilike(like))).limit(10).all():
            people.append({"id": l.id, "type": "lawyer", "name": l.name, "email": l.email})

    return {"query": q, "cases": cases, "documents": documents, "people": people}
