from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.routes import auth, dayan_auth, lawyer_auth, lawyer, dayan, cases, documents, payments, schedule, admin, notifications, events, search, inbox

settings = get_settings()

app = FastAPI(
    title="כרמי המשפט — API",
    description="בית דין לממונות — מערכת ניהול תיקים",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

_origins = [settings.FRONTEND_URL]
if settings.APP_ENV == "development":
    _origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dayan_auth.router)
app.include_router(lawyer_auth.router)
app.include_router(lawyer.router)
app.include_router(dayan.router)
app.include_router(cases.router)
app.include_router(documents.router)
app.include_router(payments.router)
app.include_router(schedule.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(events.router)
app.include_router(search.router)
app.include_router(inbox.router)


@app.get("/health")
def health():
    return {"status": "ok"}
