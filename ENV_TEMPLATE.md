# 🔐 Environment Variables Template

העתק את התוכן הרלוונטי ליצירת קבצי `.env`.

---

## 📁 קובץ ראשי: `.env` (בתיקייה הראשית)

צור קובץ `.env` **בתיקייה הראשית** של הפרויקט (ליד `docker-compose.yml`):

```env
# ============================================
# OmerOpsMap - Environment Variables
# ============================================

# Secret Key for JWT
# ------------------
# חייב להיות מחרוזת אקראית וארוכה (32+ תווים)
# ליצירת מפתח אקראי הרץ:
#   python -c "import secrets; print(secrets.token_urlsafe(32))"
#
SECRET_KEY=your-super-secret-key-change-this-in-production-12345

# Initial Admin
# -------------
# Admin ייווצר אוטומטית בהפעלה הראשונה
# אחרי יצירתו, אפשר למחוק את השורות האלה
#
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=Admin123!
INITIAL_ADMIN_DISPLAY_NAME=מנהל ראשי
INITIAL_ADMIN_EMAIL=admin@example.com
```

---

## 🔑 הסבר על כל משתנה

### SECRET_KEY (חובה)

**מה זה:** מפתח סודי לחתימת JWT tokens (אימות משתמשים).

**דרישות:**
- אורך מינימלי: 32 תווים
- אקראי ובלתי ניתן לניחוש
- **שונה לכל סביבה!** (dev/staging/production)

**ליצירת מפתח אקראי:**
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**דוגמה:**
```env
SECRET_KEY=8xK9mN2pQ5rT7vW1yB4dF6hJ0lZ3cX5aE8gI
```

---

### INITIAL_ADMIN_USERNAME (אופציונלי)

**מה זה:** שם המשתמש של ה-Admin הראשון.

**ברירת מחדל:** לא ייווצר admin אם ריק.

**דוגמה:**
```env
INITIAL_ADMIN_USERNAME=admin
```

---

### INITIAL_ADMIN_PASSWORD (אופציונלי)

**מה זה:** סיסמת ה-Admin הראשון.

**המלצות:**
- 8+ תווים
- אותיות גדולות וקטנות
- מספרים
- תווים מיוחדים

**דוגמה:**
```env
INITIAL_ADMIN_PASSWORD=MyStr0ng!Pass#2024
```

---

### INITIAL_ADMIN_DISPLAY_NAME (אופציונלי)

**מה זה:** השם שיוצג במערכת.

**ברירת מחדל:** ריק.

**דוגמה:**
```env
INITIAL_ADMIN_DISPLAY_NAME=מנהל ראשי
```

---

### INITIAL_ADMIN_EMAIL (אופציונלי)

**מה זה:** כתובת אימייל של ה-Admin.

**ברירת מחדל:** ריק.

**דוגמה:**
```env
INITIAL_ADMIN_EMAIL=admin@city.gov.il
```

---

## 📋 דוגמה מלאה

### Development:

```env
SECRET_KEY=dev-secret-key-not-for-production-12345678901234567890

INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=admin123
INITIAL_ADMIN_DISPLAY_NAME=מפתח
INITIAL_ADMIN_EMAIL=dev@localhost
```

### Production:

```env
SECRET_KEY=8xK9mN2pQ5rT7vW1yB4dF6hJ0lZ3cX5aE8gI2kM4nP6qS9tU1wY

# הסר את השורות הבאות אחרי יצירת ה-Admin!
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=MyStr0ng!Pass#2024
INITIAL_ADMIN_DISPLAY_NAME=מנהל ראשי
INITIAL_ADMIN_EMAIL=admin@city.gov.il
```

---

## 🚨 אזהרות אבטחה

1. **לעולם אל תעלה `.env` ל-Git!**  
   הקובץ כבר ב-`.gitignore`

2. **שנה את SECRET_KEY בפרודקשן!**  
   אל תשתמש ב-default

3. **מחק את INITIAL_ADMIN_* אחרי יצירת ה-Admin**  
   לא נחוץ יותר

4. **השתמש בסיסמאות חזקות!**  
   במיוחד בפרודקשן

---

## 📁 קבצי .env נוספים (לא בשימוש כרגע)

### back/Ai_agent/.env

```env
# OpenAI API Key (לשימוש עתידי)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Tavily API Key (לשימוש עתידי)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### back/MCP_servers/web_search/.env

```env
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔗 איפה להשיג API Keys

| Key | כתובת | מחיר |
|-----|-------|------|
| OpenAI | https://platform.openai.com/api-keys | Pay-as-you-go |
| Tavily | https://tavily.com/ | Free tier |

---

## ❓ שאלות נפוצות

**ש: מה קורה אם לא יצרתי .env?**  
ת: Docker Compose ישתמש בערכי ברירת מחדל, אבל לא ייווצר Admin.

**ש: איך מוסיפים Admin נוסף?**  
ת: כרגע רק דרך ה-database ישירות. בעתיד - דרך Admin Panel.

**ש: שכחתי את הסיסמה, מה עושים?**  
ת: מחק את ה-volume ותן ל-Docker ליצור Admin חדש:
```powershell
docker-compose down -v
# ערוך .env עם סיסמה חדשה
docker-compose up -d --build
```
