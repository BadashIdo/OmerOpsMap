# 🗺️ OmerOpsMap

**מערכת ניהול תפעולית עירונית לעיר עומר**

פלטפורמה מבוססת מפה לניהול אתרים עירוניים, שירותים ואירועים בזמן אמת.

---

## 🚀 התחלה מהירה

**[👉 START_HERE.md](START_HERE.md)** - מדריך מלא שלב-אחר-שלב

### TL;DR - 5 פקודות:

```powershell
# 1. Clone
git clone https://github.com/YOUR_USERNAME/OmerOpsMap.git
cd OmerOpsMap

# 2. צור .env (ראה START_HERE.md לפרטים)
notepad .env

# 3. הרץ
docker-compose up -d --build

# 4. טען נתונים
docker cp front/public/sites.xlsx omeropsmap_data_server:/app/sites.xlsx
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py

# 5. פתח
# http://localhost:5173
```

---

## 🌟 תכונות עיקריות

### 🗺️ מפה אינטראקטיבית
- אתרים קבועים (מוסדות, פארקים, שירותים)
- אירועים זמניים (חסימות, עבודות, אירועים)
- סינון לפי קטגוריה ורובע
- חיפוש חכם
- מעקב מיקום

### ⚡ עדכונים בזמן אמת
- WebSocket לסנכרון מיידי
- התראות Toast
- תפוגה אוטומטית של אירועים

### 📤 העלאת דאטה
- **CLI משופר** - preview, merge/replace modes, logging
- **UI בממשק Admin** - drag & drop, תצוגה מקדימה
- תמיכה מלאה בקבצי Excel (ITM → WGS84)

### 🔐 מערכת הרשאות
- **אורח** - צפייה + דיווח על אירועים
- **מנהל** - CRUD מלא + אישור בקשות

### 📝 בקשות משתמשים
- לחיצה ארוכה על המפה לדיווח
- Admin מאשר/דוחה
- היסטוריית בקשות

### 💬 AI ChatBot (בהכנה לאינטגרציה)
- ממשק צ'אט מודרני בצד שמאל למטה
- מוכן לחיבור עם AI Agent (Port 8000)
- Session management ו-WebSocket support
- תיעוד מלא של API endpoints

---

## 🏗️ ארכיטקטורה

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│                   http://localhost:5173                   │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────▼────────────────────────────────┐
│                Data Server (FastAPI)                      │
│                  http://localhost:8001                    │
└─────────────────────────┬────────────────────────────────┘
                          │ SQL
┌─────────────────────────▼────────────────────────────────┐
│                   PostgreSQL                              │
│                   localhost:5432                          │
└──────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** React 18, Vite, Leaflet, WebSocket
- **Backend:** FastAPI, SQLAlchemy, Alembic
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker, Docker Compose

---

## 📁 מבנה הפרויקט

```
OmerOpsMap/
├── docker-compose.yml    # מריץ את כל המערכת
├── .env                  # משתני סביבה (צריך ליצור!)
├── START_HERE.md         # 👈 מדריך התקנה מלא
│
├── data_server/          # Backend
│   ├── app/              # קוד FastAPI
│   ├── alembic/          # Migrations
│   └── scripts/          # סקריפטים
│
├── front/                # Frontend
│   ├── src/              # קוד React
│   └── public/           # קבצים סטטיים
│
└── back/                 # 🔮 AI Agent (בפיתוח - למיזוג עתידי)
```

---

## 📚 תיעוד

| קובץ | תוכן |
|------|------|
| [START_HERE.md](START_HERE.md) | **מדריך התקנה מלא** - התחל פה! |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ארכיטקטורה, Use Cases, דיאגרמות |
| [DIAGRAMS_ONLY.md](DIAGRAMS_ONLY.md) | כל הדיאגרמות |
| [ENV_TEMPLATE.md](ENV_TEMPLATE.md) | תבניות .env |
| [CLEANUP_AND_OPTIMIZATION_PLAN.md](CLEANUP_AND_OPTIMIZATION_PLAN.md) | תכנית ניקיון ואופטימיזציה |

## 🔮 AI Agent (בפיתוח)

התיקייה `back/` מכילה AI Agent + MCP servers שנמצאים בפיתוח פעיל על ידי חבר צוות.
כאשר יהיו מוכנים, הם יימזגו למערכת הראשית.

**Frontend מוכן:** הממשק כבר כולל ChatBot מלוטש (צד שמאל למטה 💬)

**Ports שמורים:**
- 8000: AI Agent API
- 3333: Web Search MCP
- 3334: Math MCP

**תיעוד:**
- [AI_AGENT_INTEGRATION.md](AI_AGENT_INTEGRATION.md) - **מדריך אינטגרציה מלא** 📖
- [back/README.MD](back/README.MD) - תיעוד AI Agent

---

## 📚 תיעוד מלא

📖 **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - **אינדקס מרכזי לכל התיעוד**

**מדריכים עיקריים:**
- [START_HERE.md](START_HERE.md) - מדריך התקנה שלב-אחר-שלב
- [AI_AGENT_INTEGRATION.md](AI_AGENT_INTEGRATION.md) - אינטגרציה AI Agent
- [DATA_UPLOAD_GUIDE.md](DATA_UPLOAD_GUIDE.md) - העלאת דאטה
- [ARCHITECTURE.md](ARCHITECTURE.md) - ארכיטקטורה + Use Cases
- [ENV_TEMPLATE.md](ENV_TEMPLATE.md) - משתני סביבה
- [CHANGELOG.md](CHANGELOG.md) - שינויים

---

## 🔧 פקודות מהירות

```powershell
# הפעלה
docker-compose up -d

# עצירה
docker-compose down

# Logs
docker-compose logs -f

# איפוס מלא
docker-compose down -v
docker-compose up -d --build
```

---

## 📄 License

MIT
