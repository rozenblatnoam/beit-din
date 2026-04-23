import json
import io
from typing import Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from fastapi import UploadFile
from app.core.config import get_settings

settings = get_settings()

SCOPES = ["https://www.googleapis.com/auth/drive"]


def _get_drive_service():
    creds_dict = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
    creds = service_account.Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    return build("drive", "v3", credentials=creds)


def upload_file(file: UploadFile, case_number: str) -> dict:
    service = _get_drive_service()

    folder_id = _get_or_create_case_folder(service, case_number)

    file_metadata = {"name": file.filename, "parents": [folder_id]}
    content = file.file.read()
    media = MediaIoBaseUpload(io.BytesIO(content), mimetype=file.content_type or "application/octet-stream")

    created = service.files().create(body=file_metadata, media_body=media, fields="id,webViewLink,size").execute()

    service.permissions().create(fileId=created["id"], body={"type": "anyone", "role": "reader"}).execute()

    return {
        "drive_file_id": created["id"],
        "drive_view_url": created.get("webViewLink"),
        "size_bytes": int(created.get("size", 0)),
    }


def delete_file(drive_file_id: str) -> None:
    service = _get_drive_service()
    service.files().delete(fileId=drive_file_id).execute()


def _get_or_create_case_folder(service, case_number: str) -> str:
    query = (
        f"name='{case_number}' and "
        f"'{settings.GOOGLE_DRIVE_FOLDER_ID}' in parents and "
        "mimeType='application/vnd.google-apps.folder' and trashed=false"
    )
    results = service.files().list(q=query, fields="files(id)").execute()
    files = results.get("files", [])
    if files:
        return files[0]["id"]

    folder_meta = {
        "name": case_number,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [settings.GOOGLE_DRIVE_FOLDER_ID],
    }
    folder = service.files().create(body=folder_meta, fields="id").execute()
    return folder["id"]
