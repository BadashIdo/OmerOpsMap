# 🚀 OmerOpsMap - מדריך התקנה והפעלה

> **מדריך שלב-אחר-שלב** להרצת המערכת מ-Clone עד אפליקציה עובדת

---

## 📋 תוכן עניינים

1. [דרישות מקדימות](#-שלב-1-דרישות-מקדימות)
2. [Clone הפרויקט](#-שלב-2-clone-הפרויקט)
3. [הגדרת Environment Variables](#-שלב-3-הגדרת-environment-variables)
4. [הרצת Docker Compose](#-שלב-4-הרצת-docker-compose)
5. [טעינת נתונים מ-Excel](#-שלב-5-טעינת-נתונים-מ-excel)
6. [בדיקה שהכל עובד](#-שלב-6-בדיקה-שהכל-עובד)
7. [שימוש במערכת](#-שלב-7-שימוש-במערכת)
8. [בעיות נפוצות ופתרונות](#-בעיות-נפוצות-ופתרונות)
9. [פקודות שימושיות](#-פקודות-שימושיות)

---

## 📦 שלב 1: דרישות מקדימות

### חובה להתקין:

#### 1. Docker Desktop
- **הורדה:** https://www.docker.com/products/docker-desktop/
- **Windows:** צריך WSL2 מופעל
- **בדיקה:** 
  ```powershell
  docker --version
  # צריך לראות: Docker version 24.x.x או יותר
  ```

#### 2. Git
- **הורדה:** https://git-scm.com/downloads
- **בדיקה:**
  ```powershell
  git --version
  ```

### ⚠️ בעיות נפוצות בשלב זה:

| בעיה | פתרון |
|------|--------|
| `docker: command not found` | התקן Docker Desktop והפעל מחדש את Terminal |
| `error during connect: ... Is the docker daemon running?` | פתח את Docker Desktop וחכה שיעלה |
| WSL2 לא מותקן | הרץ: `wsl --install` ב-PowerShell כמנהל |

---

## 📥 שלב 2: Clone הפרויקט

```powershell
# Clone
git clone https://github.com/YOUR_USERNAME/OmerOpsMap.git

# כניסה לתיקייה
cd OmerOpsMap
```

### ⚠️ בעיות נפוצות:

| בעיה | פתרון |
|------|--------|
| `git: command not found` | התקן Git |
| `repository not found` | וודא שה-URL נכון ושיש לך הרשאות |

---

## 🔐 שלב 3: הגדרת Environment Variables

### יצירת קובץ `.env` בתיקייה הראשית:

```powershell
# צור קובץ .env בתיקייה הראשית
notepad .env
```

### העתק והדבק את התוכן הבא:

```env
# ============================================
# OmerOpsMap Environment Variables
# ============================================

# Secret Key for JWT (חייב לשנות בפרודקשן!)
SECRET_KEY=my-super-secret-key-change-this-in-production-12345

# Admin ראשוני (יווצר אוטומטית בהפעלה ראשונה)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=Admin123!
INITIAL_ADMIN_DISPLAY_NAME=מנהל ראשי
INITIAL_ADMIN_EMAIL=admin@example.com
```

### 🔑 שנה את הערכים לפי הצורך:

| משתנה | מה לשים | חובה? |
|-------|---------|-------|
| `SECRET_KEY` | מחרוזת אקראית ארוכה (32+ תווים) | ✅ כן |
| `INITIAL_ADMIN_USERNAME` | שם המשתמש שלך | ✅ כן |
| `INITIAL_ADMIN_PASSWORD` | סיסמה חזקה | ✅ כן |
| `INITIAL_ADMIN_DISPLAY_NAME` | השם שיוצג במערכת | אופציונלי |
| `INITIAL_ADMIN_EMAIL` | אימייל | אופציונלי |

### 💡 ליצירת SECRET_KEY אקראי:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### ⚠️ בעיות נפוצות:

| בעיה | פתרון |
|------|--------|
| שכחת ליצור `.env` | Docker Compose ייכשל. צור את הקובץ! |
| סיסמה חלשה מדי | השתמש באותיות, מספרים ותווים מיוחדים |

---

## 🐳 שלב 4: הרצת Docker Compose

### 4.1 וודא ש-Docker Desktop רץ

פתח את Docker Desktop וחכה שהאייקון יהפוך לירוק.

### 4.2 הרץ את המערכת

```powershell
# מתיקיית הפרויקט הראשית (OmerOpsMap/)
docker-compose up -d --build
```

### 4.3 חכה שהכל יעלה

הפקודה תבנה ותריץ 3 containers:
- `omeropsmap_postgres` - מסד נתונים
- `omeropsmap_data_server` - Backend API
- `omeropsmap_frontend` - Frontend React

**זמן משוער:** 2-5 דקות בפעם הראשונה

### 4.4 וודא שהכל רץ

```powershell
docker ps
```

**צריך לראות:**
```
NAMES                     STATUS              PORTS
omeropsmap_frontend       Up X minutes        0.0.0.0:5173->5173/tcp
omeropsmap_data_server    Up X minutes        0.0.0.0:8001->8001/tcp
omeropsmap_postgres       Up X minutes        0.0.0.0:5432->5432/tcp
```

### ⚠️ בעיות נפוצות:

| בעיה | פתרון |
|------|--------|
| `port is already allocated` | סגור תוכנה אחרת שמשתמשת בפורט או שנה בdocker-compose |
| `error during connect` | וודא ש-Docker Desktop רץ |
| Container עולה ונופל | בדוק logs: `docker logs omeropsmap_data_server` |
| `no matching manifest for windows/amd64` | וודא ש-Docker משתמש ב-Linux containers (לא Windows) |

---

## 📊 שלב 5: טעינת נתונים מ-Excel

### 5.1 העתק את קובץ ה-Excel ל-Container

```powershell
docker cp front/public/Omer_GIS_Reorganized_Final.xlsx omeropsmap_data_server:/app/sites.xlsx
```

### 5.2 הרץ את סקריפט הטעינה

```powershell
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py
```

### 5.3 אמור לראות:

```
📖 Reading Excel file: /app/sites.xlsx
📋 Found columns: ['אתר', 'רובע ', ...]
📊 Found 121 rows in Excel
✅ Prepared 83 sites for import
⚠️  Skipped 38 rows
✅ Successfully imported 83 sites!
```

### ⚠️ בעיות נפוצות:

| בעיה | פתרון |
|------|--------|
| `No such file or directory` | וודא שהעתקת את הקובץ (שלב 5.1) |
| `ModuleNotFoundError` | הקובץ לא בcontainer. העתק שוב. |
| שגיאת קואורדינטות | חלק מהשורות ב-Excel חסרות קואורדינטות (זה בסדר) |

---

## ✅ שלב 6: בדיקה שהכל עובד

### 6.1 בדיקת API

```powershell
# בדיקה שהשרת עובד
curl http://localhost:8001/
# צריך לראות: {"message":"OmerOpsMap Data Server","version":"1.0.0","status":"running"}

# בדיקה שיש נתונים
curl http://localhost:8001/api/permanent-sites
# צריך לראות: רשימת JSON עם אתרים
```

### 6.2 בדיקת התחברות Admin

```powershell
# PowerShell:
$body = '{"username":"admin","password":"Admin123!"}'
Invoke-WebRequest -Uri "http://localhost:8001/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing

# צריך לראות: StatusCode: 200
```

### 6.3 בדיקת Frontend

פתח דפדפן וגלוש ל:
```
http://localhost:5173
```

**צריך לראות:** דף כניסה עם אפשרויות "כניסה כאורח" ו"כניסה כמנהל"

### ⚠️ בעיות נפוצות:

| בעיה | פתרון |
|------|--------|
| `Connection refused` | Containers לא רצים. הרץ `docker-compose up -d` |
| דף ריק | רענן עם Ctrl+Shift+R |
| שגיאת התחברות | וודא שהסיסמה ב-.env תואמת למה שאתה מקליד |

---

## 🎮 שלב 7: שימוש במערכת

### כניסה כאורח

1. פתח http://localhost:5173
2. לחץ **"כניסה כאורח"**
3. תראה מפה עם כל האתרים!

**מה אורח יכול לעשות:**
- לצפות במפה ובאתרים
- לחפש אתרים
- לסנן לפי קטגוריה/רובע
- לשלוח בקשות לאדמין (לחיצה ארוכה על המפה)

### כניסה כמנהל

1. פתח http://localhost:5173
2. לחץ **"כניסה כמנהל"**
3. הכנס:
   - שם משתמש: `admin` (או מה שהגדרת)
   - סיסמה: `Admin123!` (או מה שהגדרת)
4. לחץ **"התחבר"**

**מה מנהל יכול לעשות:**
- כל מה שאורח יכול
- להוסיף/לערוך/למחוק אתרים קבועים
- להוסיף/לערוך/למחוק אירועים זמניים
- לצפות בבקשות משתמשים
- לאשר/לדחות בקשות
- להעלות קבצי Excel להעלאת נתונים (בפאנל ניהול)

### 💬 צ'אט AI (בהכנה לאינטגרציה עתידית)

בצד שמאל למטה של המסך תראה כפתור צ'אט 💬.

**סטטוס נוכחי:** הממשק מוכן, אך שירות ה-AI Agent עדיין בפיתוח.

**כשהשירות יהיה מוכן:**
- פתח את הצ'אט על ידי לחיצה על הכפתור
- שאל שאלות על המערכת, אתרים, נתונים וכו'
- קבל תשובות מותאמות אישית מה-AI

**למפתחים:** 
- **מדריך אינטגרציה מלא:** [AI_AGENT_INTEGRATION.md](AI_AGENT_INTEGRATION.md) 📖
- **תיעוד AI Agent:** [back/README.MD](back/README.MD)
- **הגדרות סביבה:** [ENV_TEMPLATE.md](ENV_TEMPLATE.md)

---

## 🔧 בעיות נפוצות ופתרונות

### 1. Docker לא מצליח לעלות

```powershell
# נקה הכל והתחל מחדש
docker-compose down -v
docker-compose up -d --build
```

### 2. Frontend לא מציג נתונים

בדוק בקונסול הדפדפן (F12) אם יש שגיאות.

**פתרון נפוץ:**
```powershell
# רענן את Frontend
docker-compose restart frontend
```

### 3. שכחתי סיסמת Admin

```powershell
# מחק את ה-Admin ותן ל-Docker ליצור מחדש
docker-compose down -v
# ערוך את .env עם סיסמה חדשה
docker-compose up -d --build
# טען מחדש את ה-Excel
docker cp front/public/sites.xlsx omeropsmap_data_server:/app/sites.xlsx
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py
```

### 4. שגיאת CORS

וודא שאתה גולש ל-`http://localhost:5173` ולא `http://127.0.0.1:5173`.

### 5. הנתונים לא נשמרים אחרי restart

הנתונים נשמרים ב-Docker Volume. אם מחקת עם `-v`, הם יימחקו.

```powershell
# restart בלי למחוק נתונים
docker-compose down
docker-compose up -d
```

---

## 📌 פקודות שימושיות

### ניהול Containers

```powershell
# הפעלה
docker-compose up -d

# עצירה
docker-compose down

# עצירה + מחיקת נתונים
docker-compose down -v

# בנייה מחדש
docker-compose up -d --build

# צפייה ב-logs
docker-compose logs -f

# logs של container ספציפי
docker logs omeropsmap_data_server
docker logs omeropsmap_frontend
docker logs omeropsmap_postgres

# restart container ספציפי
docker-compose restart data_server
docker-compose restart frontend
```

### בדיקות DB

```powershell
# כמה אתרים יש?
docker exec omeropsmap_postgres psql -U omeropsmap -d omeropsmap -c "SELECT COUNT(*) FROM permanent_sites;"

# כמה admins יש?
docker exec omeropsmap_postgres psql -U omeropsmap -d omeropsmap -c "SELECT username FROM admins;"
```

### איפוס מלא

```powershell
# מחיקת הכל והתחלה מחדש
docker-compose down -v
docker-compose up -d --build
docker cp front/public/sites.xlsx omeropsmap_data_server:/app/sites.xlsx
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py
```

---

## 🏗️ מבנה הפרויקט

```
OmerOpsMap/
├── docker-compose.yml      # 👈 מריץ את כל המערכת
├── .env                    # 👈 משתני סביבה (צריך ליצור!)
├── START_HERE.md           # 👈 אתה פה!
├── README.md               # תיאור הפרויקט
├── ARCHITECTURE.md         # ארכיטקטורה מפורטת
├── DIAGRAMS_ONLY.md        # דיאגרמות
├── ENV_TEMPLATE.md         # תבנית ל-.env
│
├── data_server/            # Backend (FastAPI + PostgreSQL)
│   ├── Dockerfile
│   ├── app/                # קוד Python
│   ├── alembic/            # Migrations
│   └── scripts/            # סקריפטים (import_excel_to_db.py)
│
├── front/                  # Frontend (React + Vite)
│   ├── Dockerfile.dev
│   ├── src/                # קוד React
│   └── public/             # קבצים סטטיים (sites.xlsx)
│
└── back/                   # 🔮 AI Agent + MCP (בפיתוח - למיזוג עתידי)
    ├── Ai_agent/           # ⚠️ אל תמחק! בעבודה
    └── MCP_servers/
```

### ⚠️ שים לב
- התיקייה `back/` נמצאת בפיתוח פעיל - **אל תמחק!**
- Ports 8000, 3333, 3334 שמורים לשימוש עתידי של AI Agent

---

## 🎯 סיכום - צ'קליסט מהיר

- [ ] Docker Desktop מותקן ורץ
- [ ] עשיתי Clone לפרויקט
- [ ] יצרתי `.env` בתיקייה הראשית
- [ ] הרצתי `docker-compose up -d --build`
- [ ] כל 3 ה-Containers רצים (`docker ps`)
- [ ] העתקתי והרצתי את סקריפט ה-Excel
- [ ] http://localhost:5173 עובד
- [ ] אני יכול להתחבר כאורח
- [ ] אני יכול להתחבר כמנהל

**הכל עובד? 🎉 אתה מוכן!**

---

## 📚 קריאה נוספת

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - ארכיטקטורה מפורטת + דיאגרמות + Use Cases
- **[DIAGRAMS_ONLY.md](DIAGRAMS_ONLY.md)** - כל הדיאגרמות במקום אחד
- **[ENV_TEMPLATE.md](ENV_TEMPLATE.md)** - תבניות מלאות לקבצי .env
- **[README.md](README.md)** - סקירה כללית של הפרויקט
