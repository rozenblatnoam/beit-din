# DinLink — תיעוד מערכת

> הפלטפורמה הדיגיטלית לבתי הדין — ניהול תיקי בוררות ודיני ממונות

---

## תוכן עניינים

1. [מבט-על על הארכיטקטורה](#מבט-על-על-הארכיטקטורה)
2. [תכונות מרכזיות](#תכונות-מרכזיות)
3. [תפקידים והרשאות](#תפקידים-והרשאות)
4. [פרטי כניסה לסביבת פיתוח](#פרטי-כניסה-לסביבת-פיתוח)
5. [התקנה והרצה](#התקנה-והרצה)
6. [פעולות אדמין נפוצות](#פעולות-אדמין-נפוצות)
7. [נקודות קצה (API)](#נקודות-קצה-api)
8. [סכמת מסד הנתונים](#סכמת-מסד-הנתונים)
9. [משתני סביבה (.env)](#משתני-סביבה-env)
10. [פתרון בעיות](#פתרון-בעיות)
11. [המלצות לפרודקשן](#המלצות-לפרודקשן)

---

## מבט-על על הארכיטקטורה

| רכיב | טכנולוגיה | פורט |
|------|-----------|------|
| Frontend | React 19 + Vite | 5173 |
| Backend  | FastAPI + SQLAlchemy 2.0 | 8000 |
| Database | PostgreSQL 16 (Docker) | 5433 |
| אחסון מסמכים | Google Drive API (Service Account) | — |
| תשלומים | Hyp (שרת סליקה ישראלי) | — |
| מייל | SMTP (ברירת מחדל: Gmail) | 587 |
| אימות | JWT (access + refresh) + Google OAuth 2.0 | — |
| לוח עברי | pyluach (חסימת שבת/חגים בשיבוץ דיונים) | — |

**מבנה הריפו:**

```
beit-din/
├── backend/              # FastAPI
│   ├── app/
│   │   ├── api/routes/   # ראוטים: auth, dayan_auth, lawyer_auth, lawyer, cases, documents, payments, schedule, admin
│   │   ├── core/         # config, database, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # google_drive, hyp, email
│   └── alembic/          # migrations
├── frontend/             # React + Vite
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/      # AppContext (state global)
│       └── api/client.js
├── docker-compose.yml    # PostgreSQL
├── start.ps1 / stop.ps1  # סקריפטי הפעלה/עצירה
└── .env                  # סודות (מוסתר מהריפו)
```

---

## תכונות מרכזיות

### 🔔 התראות בזמן אמת
מערכת התראות פולימורפית — נמען יכול להיות משתמש, דיין או עו"ד. התראה נוצרת אוטומטית על:
- פתיחת תיק חדש
- שיבוץ דיין/עו"ד לתיק
- שינוי סטטוס תיק
- העלאת מסמך לתיק
- קביעת דיון

ב-Navbar יש פעמון 🔔 עם מונה אדום של התראות שלא נקראו, לחיצה פותחת dropdown עם 10 האחרונות + קישור לעמוד מלא ב-`/notifications`.

### 📊 ציר זמן בתיק (Timeline)
כל פעולה משמעותית בתיק נרשמת כ-`CaseEvent` עם סוג (`case_opened`, `dayan_assigned`, `lawyer_assigned`, `document_uploaded`, `hearing_scheduled`, `status_changed` ועוד), אקטור, וחותמת זמן. מוצג כציר זמן ויזואלי בעמוד התיק עם אייקונים לפי סוג.

### 🔎 חיפוש מאוחד
`GET /search/?q=X` — חיפוש על תיקים, מסמכים ואנשים. **scoping אוטומטי לפי תפקיד**: לקוח רואה רק את שלו, דיין/עו"ד רק את התיקים ששובצו אליהם, אדמין רואה הכל. עמוד `/search` עם תיבת חיפוש בולטת ותוצאות מקובצות.

### 📥 Inbox / Action Items
דשבורד "פעולות הדורשות תגובה" המבוסס על נתוני המשתמש:
- **לקוח:** תיקים בסטטוס "השלמת מסמכים", תיקים בהמתנה לתגובה, דיונים בשבוע הבא
- **דיין:** דיונים שלי השבוע, תיקים שעדיין לא נקבע להם דיון
- **עו"ד:** דיונים השבוע, תיקים שזקוקים למסמכים

כולל מונה התראות שלא נקראו. מוצג ב-3 הדשבורדים (Dashboard, DayanPortal, LawyerPortal).

### 📅 לוח שנה יהודי
שילוב `pyluach` שחוסם אוטומטית קביעת דיון בשבת או בחגים/צומות (פסח, שבועות, ראש השנה, יום כיפור, סוכות, שמיני עצרת, שמחת תורה, ת״ב, צום גדליה, עשרה בטבת, תענית אסתר, י״ז בתמוז). באדמין-שדולר תופיע אזהרה צהובה כשבוחרים תאריך חסום, עם אפשרות "שבץ בכל זאת" שעוקפת.

### 📄 PDF Viewer מובנה
רכיב `DocViewer` — מודאל שמציג את המסמך מ-Google Drive בתוך iframe (Drive Preview). אין צורך לעזוב את המערכת כדי לקרוא מסמך. תמיכה ב-PDF, תמונות ומסמכי Word.

### 🚪 פורטלים נפרדים
- **לקוח:** פתיחת תיקים, העלאת מסמכים, מעקב, תשלומים
- **דיין:** ניהול תיקים שלו, יומן דיונים, זמינות, **כתיבת פרוטוקול דיון ופסק דין, הקלטה ושמירה של דיונים**
- **עו"ד/טו"ר:** חיפוש לקוחות, ניהול ייצוג, צפייה והעלאת מסמכים
- **אדמין:** CRUD מלא + שיבוץ דיינים ועורכי דין לתיקים

### 📝 פרוטוקול דיון ופסק דין (פורטל דיינים)
לכל תיק, הדיין יכול לכתוב שני מסמכים מובנים שנשמרים ישירות ב-DB (לא ב-Drive):
- **פרוטוקול דיון** (`hearing_protocol`) — תיעוד מהלך הדיון, טענות הצדדים
- **פסק דין** (`verdict`) — ההכרעה הסופית

עורך טקסט עם **שמירה אוטומטית** (1.5 שניות אחרי הקלדה אחרונה), אינדיקטור "נשמר ב-14:32", וכותרת ערוכה. הלקוח ועו"ד מקבלים התראה כשנוצר מסמך כזה.

### 🎙 הקלטת דיונים
דיין יכול להקליט את הדיון ישירות מהדפדפן (`MediaRecorder API`):
- כפתור "התחל הקלטה" → המיקרופון מבקש הרשאה → טיימר חי
- השהיה/חידוש בלחיצה
- האזנה מקדימה לפני שמירה
- שמירה ל-Google Drive כקובץ `.webm` (עד 100MB)
- ההקלטות מופיעות ב-timeline ובלשונית "הקלטות" של התיק

---

## תפקידים והרשאות

המערכת מבחינה בין **4 סוגי משתמשים**, כל אחד עם הרשאות שונות.

### 1. משתמש רגיל (User / לקוח)
- **הרשמה:** עצמית (דרך טופס `/login`) או Google OAuth
- **טוקן JWT:** ללא role מיוחד
- **יכול:**
  - לפתוח תיק חדש (`POST /cases`)
  - לראות את התיקים האישיים שלו בלבד (`GET /cases`)
  - להעלות מסמכים לתיק שלו
  - לבצע תשלומים
  - לראות את התשלומים האישיים שלו

### 2. דיין (Dayan)
- **הרשמה:** האדמין יוצר ידנית — אין הרשמה עצמית
- **טוקן JWT:** מכיל `role: "dayan"`
- **יכול:**
  - להיכנס דרך `/dayan` (אימייל+סיסמה או Google)
  - לראות את התיקים שלו ב-`GET /schedule/dayan/my/cases`
  - לעדכן זמינות שלו
  - לראות לוח דיונים שלו
- **לא יכול:** לפתוח/למחוק תיקים, לשבץ דיינים אחרים

### 3. עורך דין / טוען רבני (Lawyer / Toen)
- **הרשמה:** האדמין יוצר ידנית — אין הרשמה עצמית
- **טוקן JWT:** מכיל `role: "lawyer"`
- **יכול:**
  - להיכנס דרך `/lawyer` (אימייל+סיסמה או Google)
  - לחפש תיקים שלו לפי שם הלקוח / מספר תיק (`GET /lawyer/search`)
  - לראות מסמכי תיק שהוא משובץ אליו
  - להעלות מסמכים לתיק
  - למחוק רק מסמכים שהוא העלה
- **לא יכול:** לראות תיקים שאינם שלו, לשבץ עצמו לתיק

### 4. אדמין / מנהל
- **יצירה:** הראשון נוצר ידנית במסד הנתונים. האדמין הראשון יכול ליצור עוד אדמינים אם צריך (כרגע דרך עדכון `is_admin=True` ב-DB ידנית).
- **טוקן JWT:** משתמש רגיל עם `is_admin=True` בעמודת המשתמש
- **יכול הכל**:
  - CRUD על דיינים (`/admin/dayans`)
  - CRUD על עורכי דין (`/admin/lawyers`)
  - שיבוץ דיין ועו"ד לתיק (`PATCH /admin/cases/{id}`)
  - לראות את כל המשתמשים והתיקים
  - להפעיל/לכבות משתמשים

> **הערה אבטחה:** אדמין לא יכול לראות סיסמאות (הן מוצפנות ב-bcrypt). הוא יכול רק לאפס סיסמה דרך עדכון מודל הדיין/עו"ד.

---

## פרטי כניסה לסביבת פיתוח

> ⚠️ **לסביבת פיתוח לוקאלית בלבד.** יש לשנות את כל הסיסמאות הללו לפני העלאה לפרודקשן.

| תפקיד | URL | אימייל | סיסמה |
|--------|------|--------|-------|
| **אדמין** | [/login](http://localhost:5173/login) | `admin@karmeimishpat.co.il` | `admin1234` |
| **דיין דוגמה** | [/dayan](http://localhost:5173/dayan) | `rabbi.cohen@example.com` | `dayan1234` |
| **עו"ד דוגמה** | [/lawyer](http://localhost:5173/lawyer) | `avi@example.com` | `pass1234` |
| **לקוח דוגמה** | [/login](http://localhost:5173/login) | `client@example.com` | `client1234` |

**תיק דוגמה:** `2026-0001` — Contract dispute, סכום ₪45,000, משובץ לדיין `rabbi.cohen@example.com` ולעו"ד `avi@example.com`.

**מסד נתונים (Postgres):**
- Host: `localhost`
- Port: `5433`
- DB: `beitdin_db`
- User: `beitdin_user`
- Password: `strongpassword`

---

## התקנה והרצה

### דרישות

- Windows 11
- Docker Desktop
- Python 3.13+
- Node.js 22+
- PowerShell 5.1+

### התקנה ראשונית

```powershell
# 1. שכפול מהגיטהאב
git clone https://github.com/rozenblatnoam/beit-din.git
cd beit-din

# 2. יצירת קובץ .env מהתבנית
Copy-Item .env.example .env

# 3. תלויות פייתון
cd backend
pip install --prefer-binary -r requirements.txt
cd ..

# 4. תלויות Node
cd frontend
npm install
cd ..

# 5. אישור הרצת סקריפטים (פעם אחת)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### הפעלה יומיומית

**מ-PowerShell:**
```powershell
.\start.ps1
```

**מ-CMD (או דאבל-קליק ב-Explorer):**
```cmd
start.bat
```

(`.bat` הוא wrapper שמריץ את ה-`.ps1` עם הדגלים הנכונים.)

הסקריפט יבצע:
1. ימתין עד 30 שניות לעלייה של Docker Desktop
2. יעלה את `postgres:16-alpine` בקונטיינר
3. יחיל מיגרציות חדשות (`alembic upgrade head`)
4. יפתח 2 חלונות PowerShell עם הבקאנד והפרונטאנד

**כתובות:**
- אפליקציה: [http://localhost:5173](http://localhost:5173)
- Swagger API: [http://localhost:8000/docs](http://localhost:8000/docs)

### עצירה

```powershell
.\stop.ps1
```
(או `stop.bat` מ-CMD)

---

## פעולות אדמין נפוצות

### יצירת אדמין ראשון (פעם אחת בלבד, ידנית)

```powershell
cd backend
python -c "
from app.core.database import SessionLocal
from app.models import user, dayan, lawyer, case, document, payment, schedule
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()
admin = User(
    email='admin@karmeimishpat.co.il',
    name='Admin',
    hashed_password=hash_password('admin1234'),
    is_admin=True,
    is_active=True,
)
db.add(admin); db.commit()
print(f'Created admin: {admin.email}')
db.close()
"
```

### יצירת דיין (דרך ה-API, מחובר כאדמין)

```powershell
$tok = (Invoke-RestMethod -Method POST -Uri http://localhost:8000/auth/login -ContentType "application/json" -Body '{"email":"admin@karmeimishpat.co.il","password":"admin1234"}').access_token

Invoke-RestMethod -Method POST -Uri http://localhost:8000/admin/dayans `
  -Headers @{ Authorization = "Bearer $tok" } `
  -ContentType "application/json" `
  -Body '{"email":"dayan1@example.com","name":"Rabbi Cohen","short_name":"Cohen","specialty":"דיני ממונות","password":"dayan1234"}'
```

### יצירת עו"ד / טו"ר

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:8000/admin/lawyers `
  -Headers @{ Authorization = "Bearer $tok" } `
  -ContentType "application/json" `
  -Body '{"email":"lawyer1@example.com","name":"Avi Cohen","short_name":"Avi","role":"lawyer","license_number":"12345","password":"pass1234"}'
```

> שדה `role`: `"lawyer"` עבור עורך דין, `"toen"` עבור טוען רבני.

### שיבוץ דיין ועו"ד לתיק

```powershell
Invoke-RestMethod -Method PATCH -Uri http://localhost:8000/admin/cases/1 `
  -Headers @{ Authorization = "Bearer $tok" } `
  -ContentType "application/json" `
  -Body '{"dayan_id":1,"lawyer_id":1}'
```

### איפוס סיסמה לדיין/עו"ד

כרגע אין endpoint ייעודי. יש לעשות זאת ידנית:

```powershell
cd backend
python -c "
from app.core.database import SessionLocal
from app.models.lawyer import Lawyer
from app.core.security import hash_password

db = SessionLocal()
l = db.query(Lawyer).filter(Lawyer.email == 'lawyer1@example.com').first()
l.hashed_password = hash_password('NewPassword123')
db.commit()
print('Password reset')
"
```

---

## נקודות קצה (API)

### Authentication

| Method | Path | תיאור | הרשאה |
|--------|------|-------|--------|
| POST | `/auth/register` | הרשמת משתמש חדש | פתוח |
| POST | `/auth/login` | התחברות משתמש | פתוח |
| POST | `/auth/refresh` | חידוש access token | refresh token |
| GET  | `/auth/google` | התחלת OAuth | פתוח |
| GET  | `/auth/google/callback` | סיום OAuth | Google |
| POST | `/auth/dayan/login` | התחברות דיין | פתוח |
| POST | `/auth/dayan/refresh` | חידוש טוקן דיין | refresh token |
| GET  | `/auth/dayan/google` | OAuth דיין | פתוח |
| POST | `/auth/lawyer/login` | התחברות עו"ד/טו"ר | פתוח |
| POST | `/auth/lawyer/refresh` | חידוש טוקן עו"ד | refresh token |
| GET  | `/auth/lawyer/google` | OAuth עו"ד | פתוח |

### Cases (משתמש)

| Method | Path | תיאור |
|--------|------|-------|
| POST | `/cases/` | פתיחת תיק חדש |
| GET  | `/cases/` | רשימת התיקים שלי |
| GET  | `/cases/{id}` | פרטי תיק (רק שלי) |

### Documents (משתמש)

| Method | Path | תיאור |
|--------|------|-------|
| POST | `/documents/` | העלאת קובץ (multipart, עם case_id) |
| GET  | `/documents/case/{id}` | רשימת מסמכים של תיק |
| DELETE | `/documents/{id}` | מחיקת מסמך (רק של עצמי) |

### Payments

| Method | Path | תיאור |
|--------|------|-------|
| POST | `/payments/` | יצירת חיוב חדש (מקבל URL להפנייה ל-Hyp) |
| GET  | `/payments/my` | תשלומים שלי |
| POST | `/payments/webhook` | webhook מ-Hyp (פתוח, מאומת בחתימה) |

### Lawyer Portal

| Method | Path | תיאור |
|--------|------|-------|
| GET  | `/lawyer/search?client=X&case_number=Y` | חיפוש תיקים |
| GET  | `/lawyer/cases/{id}` | פרטי תיק |
| GET  | `/lawyer/cases/{id}/documents` | מסמכי תיק |
| POST | `/lawyer/cases/{id}/documents` | העלאת מסמך |
| DELETE | `/lawyer/documents/{id}` | מחיקת מסמך שלי |

### Dayan / Schedule

| Method | Path | תיאור |
|--------|------|-------|
| GET  | `/schedule/dayan/my` | לוח הדיונים שלי |
| GET  | `/schedule/dayan/my/cases` | התיקים שלי |
| GET  | `/schedule/dayan/my/availability` | זמינות שלי |
| PUT  | `/schedule/availability` | עדכון זמינות |
| POST | `/schedule/` | יצירת דיון (אדמין). חוסם שבת/חג; שלח `?force=true` כדי לעקוף |
| GET  | `/schedule/check-date?date=ISO` | בדיקת תאריך — מחזיר `{blocked: "שבת" \| "פסח" \| ... \| null}` |
| DELETE | `/schedule/{id}` | מחיקת דיון (אדמין) |

### Notifications

| Method | Path | תיאור |
|--------|------|-------|
| GET  | `/notifications/?unread_only=false&limit=50` | רשימת התראות שלי |
| GET  | `/notifications/unread-count` | מונה התראות שלא נקראו (לפעמון) |
| POST | `/notifications/{id}/read` | סימון התראה כנקראה |
| POST | `/notifications/read-all` | סימון כל ההתראות כנקראו |

### Case Events (Timeline)

| Method | Path | תיאור |
|--------|------|-------|
| GET  | `/cases/{id}/events` | ציר זמן של אירועי התיק (עם בדיקת הרשאות לפי תפקיד) |

### Search

| Method | Path | תיאור |
|--------|------|-------|
| GET  | `/search/?q=X` | חיפוש מאוחד (תיקים + מסמכים + אנשים) עם scoping אוטומטי לפי תפקיד |

### Inbox / Action Items

| Method | Path | תיאור |
|--------|------|-------|
| GET  | `/inbox/` | פעולות שדורשות תגובה לפי תפקיד + ספירת התראות שלא נקראו |

### Dayan Portal (פרוטוקול / פסק דין / מסמכים)

| Method | Path | תיאור |
|--------|------|-------|
| GET  | `/dayan/cases/{id}/protocols` | רשימת פרוטוקולים בתיק (פרוטוקול דיון + פסק דין) |
| POST | `/dayan/cases/{id}/protocols` | יצירת פרוטוקול חדש (`type: hearing_protocol \| verdict`) |
| PUT  | `/dayan/protocols/{id}` | עדכון תוכן/כותרת — מקור ל-auto-save |
| DELETE | `/dayan/protocols/{id}` | מחיקת פרוטוקול |
| GET  | `/dayan/cases/{id}/documents` | מסמכי התיק (כולל הקלטות אודיו) |
| POST | `/dayan/cases/{id}/documents` | העלאת מסמך/אודיו (multipart). תומך ב-PDF/Word/תמונה ובקבצי `audio/webm,mp3,ogg,wav,mp4` עד 100MB |
| DELETE | `/dayan/documents/{id}` | מחיקת מסמך שהדיין העלה |

### Admin

| Method | Path | תיאור |
|--------|------|-------|
| GET/POST/PATCH/DELETE | `/admin/dayans` | CRUD דיינים |
| GET/POST/PATCH/DELETE | `/admin/lawyers` | CRUD עורכי דין |
| GET  | `/admin/cases` | כל התיקים |
| PATCH | `/admin/cases/{id}` | עדכון תיק (כולל שיבוץ דיין/עו"ד) |
| GET  | `/admin/users` | כל המשתמשים |
| PATCH | `/admin/users/{id}/toggle-active` | הפעלה/השבתה |

> **תיעוד מלא ואוטומטי:** [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

---

## סכמת מסד הנתונים

### טבלאות עיקריות

| טבלה | מפתח זר | תפקיד |
|------|---------|-------|
| `users` | — | משתמשי קצה (לקוחות) + אדמינים (`is_admin=true`) |
| `dayans` | — | דיינים |
| `lawyers` | — | עורכי דין וטוענים רבניים |
| `cases` | `user_id`, `dayan_id`, `lawyer_id` | תיקים — קשר למשתמש (חובה), דיין ועו"ד (אופציונלי) |
| `documents` | `case_id`, `uploaded_by_user_id` / `uploaded_by_dayan_id` / `uploaded_by_lawyer_id` | מסמכים — קשר ל-Google Drive |
| `payments` | `case_id`, `user_id` | תשלומים דרך Hyp |
| `schedules` | `case_id`, `dayan_id` | דיונים מתוזמנים |
| `dayan_availabilities` | `dayan_id` | זמינות דיינים |
| `notifications` | `recipient_user_id` / `recipient_dayan_id` / `recipient_lawyer_id`, `related_case_id` | התראות פולימורפיות — נמען אחד מהשלושה |
| `case_events` | `case_id` | רישומי ציר הזמן — `event_type`, `actor_type`, `actor_id` |
| `case_protocols` | `case_id`, `author_dayan_id` | מסמכי פרוטוקול ופסק דין — `type` (`hearing_protocol`/`verdict`), `content` בטקסט |

### Status enums

**Case status:** `open`, `pending`, `docs`, `closed`
**Payment status:** `pending`, `paid`, `failed`, `cancelled`
**Schedule type:** `hearing`, `review`, `consultation`

---

## משתני סביבה (`.env`)

```env
# Database
DATABASE_URL=postgresql://beitdin_user:strongpassword@localhost:5433/beitdin_db

# JWT
SECRET_KEY=super-secret-dev-key-replace-in-production-32chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Google OAuth (לכניסה עם Google)
GOOGLE_CLIENT_ID=REPLACE_ME
GOOGLE_CLIENT_SECRET=REPLACE_ME
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Google Drive (אחסון מסמכים)
GOOGLE_DRIVE_FOLDER_ID=REPLACE_ME
GOOGLE_SERVICE_ACCOUNT_JSON=REPLACE_ME

# Hyp (סליקה)
HYP_API_URL=https://api.hyp.co.il
HYP_MERCHANT_ID=REPLACE_ME
HYP_API_KEY=REPLACE_ME
HYP_SECRET_KEY=REPLACE_ME

# SMTP (מייל יוצא)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=REPLACE_ME
SMTP_PASSWORD=REPLACE_ME
EMAIL_FROM=noreply@karmeimishpat.co.il
EMAIL_FROM_NAME=DinLink

# App
APP_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

> **חשוב:** הקובץ `.env` ב-`.gitignore` ולא נדחף לגיט. בכל סביבה צריך ליצור אותו ידנית מ-`.env.example`.
> שירותים עם `REPLACE_ME` יידחו בחן (skip) ולא יקרסו — לדוגמה SMTP יודפס ל-log במקום לשלוח, ו-Hyp יחזיר URL מדומה.

---

## פתרון בעיות

| בעיה | פתרון |
|------|-------|
| `[1/4] Docker Desktop is not running` | פתח Docker Desktop, המתן עד שיהיה ירוק, נסה שוב |
| `Migration failed (exit code X)` | הרץ `cd backend ; alembic upgrade head` ידנית כדי לראות את השגיאה |
| `Connection refused on port 5433` | קונטיינר ה-DB לא רץ. בדוק `docker compose ps` |
| `Port 5173 is in use` | פרונטאנד אחר רץ. סגור אותו או הוסף את הפורט החדש (5174/5175) ל-CORS ב-`backend/app/main.py` |
| `module 'bcrypt' has no attribute '__about__'` | התקן `bcrypt>=4.0.0` במקום `passlib[bcrypt]` |
| `ModuleNotFoundError: pydantic_settings` | הרץ `pip install --prefer-binary -r requirements.txt` |
| הסיסמה של אדמין נשכחה | השתמש בסקריפט איפוס הסיסמה (ראה למעלה) |
| Hyp/Google Drive/SMTP מחזירים שגיאות | זה תקין אם `REPLACE_ME` ב-`.env`. השירותים נדחים בחן בסביבת dev |

---

## המלצות לפרודקשן

לפני העלאה לאוויר, **חובה לבצע**:

### אבטחה
- [ ] ליצור `SECRET_KEY` חזק (לפחות 32 תווים אקראיים): `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- [ ] להחליף את כל הסיסמאות בקובץ הזה (`admin1234`, `pass1234`, `client1234`, `strongpassword`)
- [ ] להגביל CORS ב-[backend/app/main.py](backend/app/main.py) ל-domain האמיתי בלבד (להסיר את רשימת ה-localhost)
- [ ] להשתמש ב-HTTPS (Caddy / Nginx + Let's Encrypt)
- [ ] לוודא ש-`POSTGRES_PASSWORD` ב-docker-compose מוגדר ממשתנה סביבה ולא בקוד
- [ ] לחסום את פורט 5433 מבחוץ (רק הבקאנד צריך גישה ל-DB)

### תשתית
- **המלצת hosting:** Hetzner CX22 (~€3.92/חודש, 2 vCPU / 4GB RAM)
- מסד נתונים: Postgres על אותו שרת או Hetzner Managed DB
- Reverse proxy: **Caddy** (קל יותר מ-Nginx ועם HTTPS אוטומטי)
- ניטור: Sentry או UptimeRobot
- גיבויים: `pg_dump` יומי + העלאה ל-Backblaze B2

### תצורות API חיצוניות
- [ ] להשלים `GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET` (Google Cloud Console)
- [ ] ליצור Service Account ל-Google Drive ולשתף את התיקייה עם המייל שלו
- [ ] ליצור חשבון Hyp ולקבל `HYP_MERCHANT_ID` + מפתחות
- [ ] להגדיר App Password ב-Gmail עבור SMTP (אם משתמשים ב-Gmail)

---

## מבנה ה-flow העיקרי

### לקוח פותח תיק
1. נרשם דרך `/login` → מקבל JWT
2. ב-`/new-case` ממלא טופס → `POST /cases/` → backend יוצר case_number
3. מעלה מסמכים → `POST /documents/` → הקובץ עולה ל-Google Drive
4. משלם → `POST /payments/` → מועבר ל-Hyp לסליקה → webhook חוזר
5. אדמין משבץ דיין ועו"ד לתיק
6. דיין רואה את התיק בפורטל הדיין
7. עו"ד יכול לחפש את התיק ולהעלות מסמכים נוספים

### תקשורת ב-JWT
- כל קריאה ל-API דורשת `Authorization: Bearer <access_token>`
- אם הטוקן פג (HTTP 401) — ה-frontend מחדש אוטומטית עם ה-refresh_token
- אם גם זה נכשל — מנתב אוטומטית ל-`/login`

---

**גרסה:** 1.2
**תאריך עדכון:** 2026-04-26
**מחבר:** Noam Rozenblat

### היסטוריית גרסאות

- **1.2** (2026-04-26) — פרוטוקול דיון ופסק דין בפורטל הדיינים, הקלטת דיונים מהדפדפן, מיתוג DinLink במסכי הכניסה
- **1.1** (2026-04-26) — הוספת התראות, ציר זמן, חיפוש מאוחד, Inbox/Action Items, לוח עברי, PDF Viewer מובנה
- **1.0** (2026-04-24) — תיעוד ראשוני
