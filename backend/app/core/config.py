from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path

# .env נמצא בתיקיית השורש של הפרויקט (רמה מעל backend/)
_ENV_FILE = Path(__file__).parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    GOOGLE_REDIRECT_URI_DAYAN: str = "http://localhost:8000/auth/dayan/google/callback"
    GOOGLE_REDIRECT_URI_LAWYER: str = "http://localhost:8000/auth/lawyer/google/callback"

    # Google Drive
    GOOGLE_DRIVE_FOLDER_ID: str = ""
    GOOGLE_SERVICE_ACCOUNT_JSON: str = "{}"

    # Hyp Payment
    HYP_API_URL: str = "https://api.hyp.co.il"
    HYP_MERCHANT_ID: str = ""
    HYP_API_KEY: str = ""
    HYP_SECRET_KEY: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@karmeimishpat.co.il"
    EMAIL_FROM_NAME: str = "כרמי המשפט"

    # App
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
