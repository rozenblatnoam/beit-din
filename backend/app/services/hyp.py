import hashlib
import hmac
import httpx
from app.core.config import get_settings

settings = get_settings()


def create_payment(amount: float, case_number: str, description: str, callback_url: str, success_url: str, fail_url: str) -> dict:
    """
    יוצר עסקת תשלום ב-Hyp ומחזיר את ה-URL להפניה.
    https://www.hyp.co.il/developers
    """
    if not settings.HYP_MERCHANT_ID or settings.HYP_MERCHANT_ID == "REPLACE_ME":
        return {"redirect_url": f"{settings.FRONTEND_URL}/payment/mock?amount={amount}&case={case_number}", "transaction_id": "MOCK_TX"}

    payload = {
        "MerchantNumber": settings.HYP_MERCHANT_ID,
        "Amount": int(amount * 100),
        "Currency": 1,
        "Description": description,
        "SuccessUrl": success_url,
        "FailUrl": fail_url,
        "NotifyUrl": callback_url,
        "UniqueId": case_number,
    }

    signature = _sign(payload)
    payload["Signature"] = signature

    response = httpx.post(f"{settings.HYP_API_URL}/api/createTransaction", json=payload, timeout=10)
    response.raise_for_status()
    data = response.json()

    return {
        "redirect_url": data.get("RedirectUrl"),
        "transaction_id": data.get("TransactionId"),
    }


def verify_webhook(payload: dict, signature: str) -> bool:
    expected = _sign(payload)
    return hmac.compare_digest(expected, signature)


def _sign(payload: dict) -> str:
    raw = "&".join(f"{k}={v}" for k, v in sorted(payload.items()) if k != "Signature")
    return hmac.new(settings.HYP_SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()
