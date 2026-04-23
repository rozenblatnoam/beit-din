import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


def _send(to_email: str, subject: str, html: str) -> None:
    if not settings.SMTP_USER or settings.SMTP_USER == "REPLACE_ME":
        logger.info("[EMAIL SKIP] To: %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())


def send_welcome(to_email: str, name: str) -> None:
    _send(
        to_email,
        "ברוכים הבאים לכרמי המשפט",
        f"""
        <div dir="rtl" style="font-family: Arial; padding: 20px;">
            <h2>שלום {name},</h2>
            <p>ברוכים הבאים למערכת כרמי המשפט — בית דין לממונות.</p>
            <p>ניתן להתחיל ולפתוח תיק חדש דרך הפורטל האישי שלך.</p>
            <br>
            <p>בברכה,<br>צוות כרמי המשפט</p>
        </div>
        """,
    )


def send_case_opened(to_email: str, name: str, case_number: str) -> None:
    _send(
        to_email,
        f"תיק {case_number} נפתח בהצלחה",
        f"""
        <div dir="rtl" style="font-family: Arial; padding: 20px;">
            <h2>שלום {name},</h2>
            <p>תיקך מספר <strong>{case_number}</strong> נפתח בהצלחה במערכת.</p>
            <p>נעדכן אותך בכל שלב בתהליך.</p>
            <br>
            <p>בברכה,<br>צוות כרמי המשפט</p>
        </div>
        """,
    )


def send_hearing_reminder(to_email: str, name: str, case_number: str, hearing_time: str) -> None:
    _send(
        to_email,
        f"תזכורת: דיון בתיק {case_number}",
        f"""
        <div dir="rtl" style="font-family: Arial; padding: 20px;">
            <h2>שלום {name},</h2>
            <p>תזכורת: נקבע דיון בתיקך <strong>{case_number}</strong>.</p>
            <p>מועד הדיון: <strong>{hearing_time}</strong></p>
            <br>
            <p>בברכה,<br>צוות כרמי המשפט</p>
        </div>
        """,
    )


def send_dayan_assigned(to_email: str, name: str, case_number: str, dayan_name: str) -> None:
    _send(
        to_email,
        f"שובץ דיין לתיק {case_number}",
        f"""
        <div dir="rtl" style="font-family: Arial; padding: 20px;">
            <h2>שלום {name},</h2>
            <p>הדיין <strong>{dayan_name}</strong> שובץ לתיקך מספר <strong>{case_number}</strong>.</p>
            <br>
            <p>בברכה,<br>צוות כרמי המשפט</p>
        </div>
        """,
    )


def send_payment_confirmed(to_email: str, name: str, amount: float, case_number: str) -> None:
    _send(
        to_email,
        f"אישור תשלום — תיק {case_number}",
        f"""
        <div dir="rtl" style="font-family: Arial; padding: 20px;">
            <h2>שלום {name},</h2>
            <p>התשלום בסך <strong>₪{amount:,.2f}</strong> עבור תיק <strong>{case_number}</strong> התקבל בהצלחה.</p>
            <br>
            <p>בברכה,<br>צוות כרמי המשפט</p>
        </div>
        """,
    )
