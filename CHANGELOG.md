# 📝 Changelog - OmerOpsMap

כל השינויים המשמעותיים בפרויקט מתועדים כאן.

---

## [Unreleased] - 2026-01-11

### 📚 Documentation Cleanup and Organization
- **Deleted temporary/audit files:**
  - `FRONT_AUDIT.md` - ביקורת זמנית שכבר בוצעה
  - `DATA_SERVER_AUDIT.md` - ביקורת זמנית שכבר בוצעה
  - `CLEANUP_AND_OPTIMIZATION_PLAN.md` - תכנית שכבר בוצעה
  - `back/Ai_agent/README.md` - דופליקציה (התיעוד ב-back/README.MD)

- **Created comprehensive integration guide:**
  - `AI_AGENT_INTEGRATION.md` - מדריך אינטגרציה מלא עם AI Agent
    - Step-by-step setup guide
    - API endpoints specification
    - Docker Compose configuration
    - Frontend integration instructions
    - Backend (Data Server) integration
    - Troubleshooting section
    - Security considerations
    - Complete checklist

- **Final documentation structure (11 files):**
  - `DOCUMENTATION_INDEX.md` - **אינדקס מרכזי** (חדש!)
  - `README.md` - קובץ ראשי עם quick start
  - `START_HERE.md` - מדריך התקנה מפורט
  - `AI_AGENT_INTEGRATION.md` - מדריך אינטגרציה AI Agent (חדש!)
  - `DATA_UPLOAD_GUIDE.md` - מדריך העלאת דאטה
  - `ENV_TEMPLATE.md` - הגדרות סביבה
  - `ARCHITECTURE.md` - ארכיטקטורה מלאה
  - `DIAGRAMS_ONLY.md` - אוסף דיאגרמות
  - `CHANGELOG.md` - תיעוד שינויים
  - `back/README.MD` - תיעוד AI Agent
  - `data_server/README.md` - תיעוד API
  - `front/README.md` - תיעוד Frontend

### ✨ Added - AI ChatBot (Preparation for AI Agent)
- **ChatBot Component:**
  - קומפוננטת React מודרנית עם עיצוב מלוטש
  - ממוקמת בצד שמאל למטה של המסך
  - אנימציות חלקות (slide-up, fade-in)
  - Typing indicator מונפש
  - Auto-scroll למסרים חדשים
  - RTL support מלא
  - Responsive design לטלפונים ניידים
  - Session management (שמירת session ID)
  
- **Chat Service API:**
  - `front/src/api/chatService.js` - ממשק לחיבור עם AI Agent
  - פונקציות: `sendChatMessage()`, `checkAIAgentHealth()`, `connectChatWebSocket()`
  - תמיכה ב-WebSocket עתידית
  - Error handling מקיף
  - Session ID generation אוטומטי
  
- **Integration Points:**
  - מוכן לחיבור עם `http://localhost:8000` (AI Agent)
  - תמיכת environment variable: `VITE_AI_AGENT_URL`
  - API endpoints מתועדים ומוכנים לשימוש
  - TODO comments לחיבור עתידי עם ChatBot.jsx
  
- **Documentation:**
  - עדכון ENV_TEMPLATE.md עם `VITE_AI_AGENT_URL`
  - עדכון back/README.MD עם הוראות חיבור Frontend
  - תיעוד של API endpoints בקוד
  - הוספת הסברים על session management

### 🗑️ Removed (Cleanup)
- **קבצים מיותרים:**
  - `front/app.js` - AI chat ישן (לא קשור ל-AI Agent החדש)
  - `front/styles.css` - CSS ישן
  - `front/src/components/Chat.jsx` - Placeholder מושבת
  - `front/src/data/loadSitesFromExcel.js` - Client-side loading ישן
  - `requirments.txt` - קובץ ריק בתיקייה ראשית
  - `data_server/docker-compose.yml` - כפילות
  - `front/docker-compose.yml` - כפילות
  - `data_server/scripts/migrate_excel.py` - כפילות
  - `data_server/scripts/init_admin.py` - דופליקציה (הקוד ב-main.py)
  - `data_server/scripts/run_migrations.sh` - דופליקציה (start.sh עושה את זה)

- **Dependencies (Frontend):**
  - `xlsx` (0.18.5) - לא בשימוש
  - `proj4` (2.20.2) - לא בשימוש
  - סה"כ 12 packages הוסרו

- **Dependencies (Backend):**
  - `proj` (0.2.0) - דופליקציה של `pyproj`

- **בקוד:**
  - הסרת Chat imports מ-`App.jsx`
  - הסרת `isChatOpen` state מ-`App.jsx`
  - הסרת `<Chat />` component מה-render

### 🔒 Security
- **CORS Configuration:**
  - הוספת `allowed_origins` ל-`config.py`
  - תיקון CORS ב-`main.py` - כעת משתמש ב-settings במקום `["*"]`
  - הוספת `ALLOWED_ORIGINS` ל-ENV_TEMPLATE.md
  - ברירת מחדל: `http://localhost:5173,http://localhost:3000`

### ✨ Enhanced
- **import_excel_to_db.py - שיפור מקיף:**
  - הוספת `--preview` mode - צפייה בשינויים ללא ביצוע
  - הוספת `--mode merge` - הוספת חדשים בלבד, שמירת קיימים
  - הוספת `--mode replace` - מחיקה ויבוא מחדש
  - הוספת `--file` - נתיב מותאם אישית לExcel
  - הוספת `--log-file` - שמירת log אוטומטית
  - זיהוי duplicates מתקדם
  - דוחות מפורטים (new/updated/errors)
  - Error handling משופר
  - Help text מקיף עם דוגמאות

### ✨ Added (New Features)
- **UI להעלאת Excel בממשק Admin:**
  - **DataImportTab.jsx** - ממשק ידידותי למשתמש
    - Drag & Drop להעלאת קבצים
    - תצוגה מקדימה (Preview) של השינויים
    - בחירת מצב: Merge או Replace
    - הצגת סטטיסטיקות: חדשים, כפולים, שגיאות
    - הודעות הצלחה/שגיאה ברורות
  
- **API Endpoints חדשים:**
  - `POST /api/admin/import/preview` - תצוגה מקדימה של יבוא
  - `POST /api/admin/import/execute` - ביצוע יבוא
  - תמיכה ב-file upload ו-multipart/form-data
  - Validation של קבצי Excel
  - Error handling מקיף

### 📚 Documentation
- **README.md:**
  - הוספת סעיף על AI Agent (בפיתוח)
  - הוספת CLEANUP_AND_OPTIMIZATION_PLAN.md לרשימת תיעוד
  - הבהרה על ports שמורים

- **START_HERE.md:**
  - עדכון מבנה הפרויקט
  - הוספת warning על `back/` - אל תמחק!
  - הבהרה על ports שמורים

- **back/README.MD:**
  - הוספת סעיף Integration עם המערכת הראשית
  - Ports allocation מפורט
  - נקודות אינטגרציה עתידיות
  - הוראות הרצה standalone למפתחים
  - Environment variables נדרשים
  - דוגמה למיזוג ב-docker-compose

- **ENV_TEMPLATE.md:**
  - הוספת `ALLOWED_ORIGINS` עם הסבר

- **CLEANUP_AND_OPTIMIZATION_PLAN.md:** (חדש)
  - תכנית מקיפה לניקיון ואופטימיזציה
  - רשימה מפורטת של קבצים למחיקה
  - השוואת שיטות העלאת דאטה
  - שיפורי אבטחה
  - Testing checklist
  - תוכנית ביצוע שלב-אחר-שלב

- **CHANGELOG.md:** (חדש)
  - תיעוד כל השינויים

### 🧪 Testing
- ✅ בדיקת linting - אין שגיאות
- ✅ בדיקת imports - אין imports מיותרים
- ✅ בדיקת dependencies - אין packages חסרים
- ✅ בדיקת מבנה תיקיות - הכל במקום

### 📊 Statistics
- **קבצים שנמחקו:** 10
- **Packages שהוסרו:** 13 (12 frontend + 1 backend)
- **קבצים חדשים שנוצרו:** 4
  - `data_server/app/api/import_data.py` (~200 lines)
  - `front/src/components/admin/DataImportTab.jsx` (~400 lines)
  - `CHANGELOG.md`
  - `DATA_UPLOAD_GUIDE.md`
- **שורות קוד שנוספו:** ~1,200
- **קבצי תיעוד שעודכנו:** 5
- **קבצי תיעוד חדשים:** 2

---

## [1.0.0] - לפני השינויים

### מערכת בסיסית עובדת:
- Frontend: React + Vite + Leaflet
- Backend: FastAPI + PostgreSQL
- Docker Compose setup
- Admin authentication
- WebSocket real-time updates
- Excel import (גרסה בסיסית)

---

## 📝 Format

הChangelog עוקב אחרי [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

### סוגי שינויים:
- `Added` - תכונות חדשות
- `Changed` - שינויים בפונקציונליות קיימת
- `Deprecated` - תכונות שיוסרו בעתיד
- `Removed` - תכונות שהוסרו
- `Fixed` - תיקוני באגים
- `Security` - שיפורי אבטחה
- `Enhanced` - שיפורים בתכונות קיימות
- `Documentation` - עדכוני תיעוד
