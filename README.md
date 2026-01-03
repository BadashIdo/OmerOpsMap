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

### 🔐 מערכת הרשאות
- **אורח** - צפייה + דיווח על אירועים
- **מנהל** - CRUD מלא + אישור בקשות

### 📝 בקשות משתמשים
- לחיצה ארוכה על המפה לדיווח
- Admin מאשר/דוחה
- היסטוריית בקשות

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
└── back/                 # AI Agent (לא בשימוש כרגע)
```

---

## 📚 תיעוד

| קובץ | תוכן |
|------|------|
| [START_HERE.md](START_HERE.md) | **מדריך התקנה מלא** - התחל פה! |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ארכיטקטורה, Use Cases, דיאגרמות |
| [DIAGRAMS_ONLY.md](DIAGRAMS_ONLY.md) | כל הדיאגרמות |
| [ENV_TEMPLATE.md](ENV_TEMPLATE.md) | תבניות .env |

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
