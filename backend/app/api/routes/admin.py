from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin, hash_password
from app.models.user import User
from app.models.dayan import Dayan
from app.models.lawyer import Lawyer
from app.models.case import Case
from app.schemas.dayan import DayanCreate, DayanOut, DayanUpdate
from app.schemas.lawyer import LawyerCreate, LawyerOut, LawyerUpdate
from app.schemas.case import CaseOut, CaseUpdate
from app.services import email as email_service

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Dayans ────────────────────────────────────────────

@router.post("/dayans", response_model=DayanOut, status_code=status.HTTP_201_CREATED)
def create_dayan(body: DayanCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.query(Dayan).filter(Dayan.email == body.email).first():
        raise HTTPException(status_code=400, detail="דיין עם מייל זה כבר קיים")
    dayan = Dayan(
        email=body.email,
        name=body.name,
        short_name=body.short_name,
        specialty=body.specialty,
        avatar=body.avatar,
        hashed_password=hash_password(body.password),
        created_by_admin_id=admin.id,
    )
    db.add(dayan)
    db.commit()
    db.refresh(dayan)
    return dayan


@router.get("/dayans", response_model=list[DayanOut])
def list_dayans(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Dayan).all()


@router.patch("/dayans/{dayan_id}", response_model=DayanOut)
def update_dayan(dayan_id: int, body: DayanUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    dayan = db.query(Dayan).filter(Dayan.id == dayan_id).first()
    if not dayan:
        raise HTTPException(status_code=404, detail="דיין לא נמצא")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(dayan, field, value)
    db.commit()
    db.refresh(dayan)
    return dayan


@router.delete("/dayans/{dayan_id}", status_code=204)
def delete_dayan(dayan_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    dayan = db.query(Dayan).filter(Dayan.id == dayan_id).first()
    if not dayan:
        raise HTTPException(status_code=404, detail="דיין לא נמצא")
    db.delete(dayan)
    db.commit()


# ─── Lawyers ───────────────────────────────────────────

@router.post("/lawyers", response_model=LawyerOut, status_code=status.HTTP_201_CREATED)
def create_lawyer(body: LawyerCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.query(Lawyer).filter(Lawyer.email == body.email).first():
        raise HTTPException(status_code=400, detail="עו\"ד/טו\"ר עם מייל זה כבר קיים")
    lawyer = Lawyer(
        email=body.email,
        name=body.name,
        short_name=body.short_name,
        role=body.role,
        license_number=body.license_number,
        hashed_password=hash_password(body.password),
        created_by_admin_id=admin.id,
    )
    db.add(lawyer)
    db.commit()
    db.refresh(lawyer)
    return lawyer


@router.get("/lawyers", response_model=list[LawyerOut])
def list_lawyers(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Lawyer).all()


@router.patch("/lawyers/{lawyer_id}", response_model=LawyerOut)
def update_lawyer(lawyer_id: int, body: LawyerUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    lawyer = db.query(Lawyer).filter(Lawyer.id == lawyer_id).first()
    if not lawyer:
        raise HTTPException(status_code=404, detail="עו\"ד/טו\"ר לא נמצא")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(lawyer, field, value)
    db.commit()
    db.refresh(lawyer)
    return lawyer


@router.delete("/lawyers/{lawyer_id}", status_code=204)
def delete_lawyer(lawyer_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    lawyer = db.query(Lawyer).filter(Lawyer.id == lawyer_id).first()
    if not lawyer:
        raise HTTPException(status_code=404, detail="עו\"ד/טו\"ר לא נמצא")
    db.delete(lawyer)
    db.commit()


# ─── Cases ─────────────────────────────────────────────

@router.get("/cases", response_model=list[CaseOut])
def list_all_cases(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Case).order_by(Case.opened_at.desc()).all()


@router.patch("/cases/{case_id}", response_model=CaseOut)
def update_case(case_id: int, body: CaseUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    prev_dayan_id = case.dayan_id
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)

    if body.dayan_id and body.dayan_id != prev_dayan_id:
        dayan = db.query(Dayan).filter(Dayan.id == body.dayan_id).first()
        user = db.query(User).filter(User.id == case.user_id).first()
        if dayan and user:
            email_service.send_dayan_assigned(user.email, user.name, case.case_number, dayan.name)

    return case


# ─── Users ─────────────────────────────────────────────

@router.get("/users", response_model=list[dict])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "name": u.name, "is_active": u.is_active, "created_at": str(u.created_at)} for u in users]


@router.patch("/users/{user_id}/toggle-active", status_code=200)
def toggle_user_active(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}
