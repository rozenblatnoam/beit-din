from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import get_settings
from app.models.lawyer import Lawyer
from app.schemas.lawyer import LawyerLogin, LawyerTokenResponse, LawyerOut
from app.schemas.user import RefreshRequest

router = APIRouter(prefix="/auth/lawyer", tags=["lawyer-auth"])
settings = get_settings()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_REDIRECT_URI_LAWYER = "http://localhost:8000/auth/lawyer/google/callback"


@router.post("/login", response_model=LawyerTokenResponse)
def lawyer_login(body: LawyerLogin, db: Session = Depends(get_db)):
    lawyer = db.query(Lawyer).filter(Lawyer.email == body.email).first()
    if not lawyer or not lawyer.hashed_password or not verify_password(body.password, lawyer.hashed_password):
        raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")
    if not lawyer.is_active:
        raise HTTPException(status_code=403, detail="החשבון מושבת")

    access_token = create_access_token(lawyer.id, extra={"role": "lawyer"})
    refresh_token = create_refresh_token(lawyer.id)
    return LawyerTokenResponse(access_token=access_token, refresh_token=refresh_token, lawyer=LawyerOut.model_validate(lawyer))


@router.post("/refresh", response_model=LawyerTokenResponse)
def lawyer_refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="טוקן רענון לא תקין")

    lawyer = db.query(Lawyer).filter(Lawyer.id == int(payload["sub"])).first()
    if not lawyer or not lawyer.is_active:
        raise HTTPException(status_code=401, detail="עו\"ד/טו\"ר לא נמצא")

    access_token = create_access_token(lawyer.id, extra={"role": "lawyer"})
    refresh_token = create_refresh_token(lawyer.id)
    return LawyerTokenResponse(access_token=access_token, refresh_token=refresh_token, lawyer=LawyerOut.model_validate(lawyer))


@router.get("/google")
def lawyer_google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI_LAWYER,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/google/callback", response_model=LawyerTokenResponse)
def lawyer_google_callback(code: str, db: Session = Depends(get_db)):
    token_resp = httpx.post(GOOGLE_TOKEN_URL, data={
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI_LAWYER,
        "grant_type": "authorization_code",
    })
    token_resp.raise_for_status()
    access_token_google = token_resp.json().get("access_token")

    userinfo_resp = httpx.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token_google}"})
    userinfo_resp.raise_for_status()
    info = userinfo_resp.json()

    lawyer = db.query(Lawyer).filter(Lawyer.google_id == info["sub"]).first()
    if not lawyer:
        lawyer = db.query(Lawyer).filter(Lawyer.email == info["email"]).first()
        if not lawyer:
            raise HTTPException(status_code=403, detail="עו\"ד/טו\"ר אינו רשום במערכת. פנה למנהל.")
        lawyer.google_id = info["sub"]
        db.commit()
    db.refresh(lawyer)

    access_token = create_access_token(lawyer.id, extra={"role": "lawyer"})
    refresh_token = create_refresh_token(lawyer.id)
    return LawyerTokenResponse(access_token=access_token, refresh_token=refresh_token, lawyer=LawyerOut.model_validate(lawyer))
