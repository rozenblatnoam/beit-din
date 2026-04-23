from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import get_settings
from app.models.dayan import Dayan
from app.schemas.dayan import DayanLogin, DayanTokenResponse, DayanOut
from app.schemas.user import RefreshRequest

router = APIRouter(prefix="/auth/dayan", tags=["dayan-auth"])
settings = get_settings()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_REDIRECT_URI_DAYAN = "http://localhost:8000/auth/dayan/google/callback"


@router.post("/login", response_model=DayanTokenResponse)
def dayan_login(body: DayanLogin, db: Session = Depends(get_db)):
    dayan = db.query(Dayan).filter(Dayan.email == body.email).first()
    if not dayan or not dayan.hashed_password or not verify_password(body.password, dayan.hashed_password):
        raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")
    if not dayan.is_active:
        raise HTTPException(status_code=403, detail="החשבון מושבת")

    access_token = create_access_token(dayan.id, extra={"role": "dayan"})
    refresh_token = create_refresh_token(dayan.id)
    return DayanTokenResponse(access_token=access_token, refresh_token=refresh_token, dayan=DayanOut.model_validate(dayan))


@router.post("/refresh", response_model=DayanTokenResponse)
def dayan_refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="טוקן רענון לא תקין")

    dayan = db.query(Dayan).filter(Dayan.id == int(payload["sub"])).first()
    if not dayan or not dayan.is_active:
        raise HTTPException(status_code=401, detail="דיין לא נמצא")

    access_token = create_access_token(dayan.id, extra={"role": "dayan"})
    refresh_token = create_refresh_token(dayan.id)
    return DayanTokenResponse(access_token=access_token, refresh_token=refresh_token, dayan=DayanOut.model_validate(dayan))


@router.get("/google")
def dayan_google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI_DAYAN,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/google/callback", response_model=DayanTokenResponse)
def dayan_google_callback(code: str, db: Session = Depends(get_db)):
    token_resp = httpx.post(GOOGLE_TOKEN_URL, data={
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI_DAYAN,
        "grant_type": "authorization_code",
    })
    token_resp.raise_for_status()
    access_token_google = token_resp.json().get("access_token")

    userinfo_resp = httpx.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token_google}"})
    userinfo_resp.raise_for_status()
    info = userinfo_resp.json()

    dayan = db.query(Dayan).filter(Dayan.google_id == info["sub"]).first()
    if not dayan:
        dayan = db.query(Dayan).filter(Dayan.email == info["email"]).first()
        if not dayan:
            raise HTTPException(status_code=403, detail="הדיין אינו רשום במערכת. פנה למנהל.")
        dayan.google_id = info["sub"]
        db.commit()
    db.refresh(dayan)

    access_token = create_access_token(dayan.id, extra={"role": "dayan"})
    refresh_token = create_refresh_token(dayan.id)
    return DayanTokenResponse(access_token=access_token, refresh_token=refresh_token, dayan=DayanOut.model_validate(dayan))
