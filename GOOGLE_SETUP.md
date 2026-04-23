# הגדרת Google Cloud Project

## שלב 1 — צור Google Cloud Project

1. כנס ל-[console.cloud.google.com](https://console.cloud.google.com)
2. לחץ על תפריט הפרויקטים בחלק העליון → **New Project**
3. שם הפרויקט: `karmei-mishpat`
4. לחץ **Create**

---

## שלב 2 — הפעל APIs

1. בתפריט הצדדי: **APIs & Services → Library**
2. חפש והפעל את:
   - ✅ **Google Drive API**
   - ✅ **Google+ API** (או People API)

---

## שלב 3 — OAuth 2.0 (לכניסת משתמשים / דיינים עם גוגל)

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `Karmei Mishpat Web`
4. Authorized redirect URIs — הוסף:
   ```
   http://localhost:8000/auth/google/callback
   http://localhost:8000/auth/dayan/google/callback
   ```
   (בפרודקשן תוסיף את הדומיין האמיתי)
5. לחץ **Create**
6. קבל `Client ID` ו-`Client Secret`
7. הכנס אותם ל-`.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

---

## שלב 4 — Service Account (לגוגל דרייב)

1. **APIs & Services → Credentials → Create Credentials → Service Account**
2. Name: `beitdin-drive`
3. לחץ **Create and Continue → Done**
4. לחץ על ה-Service Account שנוצר → **Keys → Add Key → JSON**
5. הורד את הקובץ — זה `GOOGLE_SERVICE_ACCOUNT_JSON`

### הכנסה ל-.env:
```bash
# המר את כל הJSON לשורה אחת:
cat service-account.json | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin)))"
```
הדבק את הפלט בתוך `.env`:
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"karmei-mishpat",...}
```

---

## שלב 5 — הגדר תיקיית Google Drive

1. כנס ל-[drive.google.com](https://drive.google.com)
2. צור תיקייה חדשה: `karmei-mishpat-docs`
3. לחץ ימני → **Share** → הזן את אימייל ה-Service Account (נראה כמו `beitdin-drive@karmei-mishpat.iam.gserviceaccount.com`)
4. תן הרשאת **Editor**
5. העתק את ה-Folder ID מה-URL:
   `https://drive.google.com/drive/folders/`**`THIS_IS_THE_ID`**
6. הכנס ל-`.env`:
   ```
   GOOGLE_DRIVE_FOLDER_ID=THIS_IS_THE_ID
   ```

---

## שלב 6 — OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**
2. User Type: **External**
3. App name: `כרמי המשפט`
4. User support email: המייל שלך
5. בשלב **Scopes** הוסף: `email`, `profile`, `openid`
6. בשלב **Test users** הוסף את המיילים שלך לבדיקה
7. לחץ **Save and Continue**

---

## סיום

לאחר מילוי כל ה-`.env`, הרץ:
```bash
docker-compose up --build
```
