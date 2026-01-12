# 📤 מדריך העלאת דאטה ל-OmerOpsMap

> **מדריך מקיף** לכל הדרכים להעלות ולעדכן נתונים במערכת

---

## 📋 תוכן עניינים

1. [סקירה כללית](#-סקירה-כללית)
2. [שיטה 1: UI בממשק Admin](#-שיטה-1-ui-בממשק-admin-קל-ביותר)
3. [שיטה 2: CLI - Command Line](#-שיטה-2-cli---command-line)
4. [שיטה 3: API Direct](#-שיטה-3-api-direct-למתקדמים)
5. [פורמט קובץ Excel](#-פורמט-קובץ-excel)
6. [שגיאות נפוצות ופתרונות](#-שגיאות-נפוצות-ופתרונות)
7. [Best Practices](#-best-practices)

---

## 🎯 סקירה כללית

### דרכים להעלות דאטה:

| שיטה | קלות שימוש | מתאים ל | סטטוס |
|------|------------|---------|-------|
| **UI Admin** | 👍 קל | כולם | ✅ זמין |
| **CLI** | 🔧 טכני | מפתחים, אוטומציה | ✅ זמין |
| **API Direct** | 🧑‍💻 מתקדם | אינטגרציות | ✅ זמין |

---

## 🎨 שיטה 1: UI בממשק Admin (קל ביותר!)

### תהליך קל ופשוט:

1. **היכנס כמנהל** למערכת (http://localhost:5173)
2. **לחץ על כפתור הניהול** בצד המסך
3. **עבור ל-tab "יבוא נתונים"** 📤
4. **גרור ושחרר** את קובץ ה-Excel (או בחר קובץ)
5. **לחץ "תצוגה מקדימה"** לראות מה ישתנה
6. **לחץ "יבא עכשיו"** לביצוע

### תכונות:

✅ **Drag & Drop** - גרור את הקובץ ישירות  
✅ **Preview חזותי** - רואה בדיוק מה ישתנה  
✅ **סטטיסטיקות** - חדשים, כפולים, שגיאות  
✅ **בחירת מצב** - Merge או Replace  
✅ **הודעות ברורות** - הצלחה או שגיאות  
✅ **ללא Docker** - לא צריך גישה לטרמינל  

### מצבי יבוא:

**🔀 Merge Mode (מומלץ):**
- מוסיף רק אתרים חדשים
- משאיר אתרים קיימים ללא שינוי
- מדלג על כפולים (לפי שם)

**🔄 Replace Mode (זהירות!):**
- מוחק את כל האתרים הקיימים
- מייבא הכל מחדש מהקובץ
- מתאים לאיפוס מלא

**תמונת מסך:**
```
┌─────────────────────────────────────┐
│  📤 יבוא נתונים מExcel               │
├─────────────────────────────────────┤
│  בחר סוג יבוא:                      │
│  ○ Merge  ● Replace                 │
├─────────────────────────────────────┤
│        📁                            │
│  גרור ושחרר קובץ Excel כאן          │
│           או                         │
│     [ בחר קובץ ]                     │
├─────────────────────────────────────┤
│  [ 👁️ תצוגה מקדימה ] [ ✅ יבא עכשיו ]│
└─────────────────────────────────────┘
```

---

## 🔧 שיטה 2: CLI - Command Line

### תהליך מהיר:

```powershell
# 1. העתק את קובץ ה-Excel ל-container
docker cp front/public/sites.xlsx omeropsmap_data_server:/app/sites.xlsx

# 2. הרץ import
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py
```

---

### 🎛️ אופציות מתקדמות

#### Preview Mode - צפייה ללא שינויים
```powershell
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --preview
```

**תוצאה:**
```
🔍 PREVIEW MODE - No changes will be made
================================================

📖 Reading Excel file: /app/sites.xlsx
📋 Found 15 columns
📊 Found 121 rows in Excel
✅ Prepared 83 valid sites
⚠️  Skipped 38 rows with errors

📊 IMPORT PREVIEW:
  • Current DB sites: 75
  • Sites in Excel: 83
  • New sites to add: 15
  • Duplicate names found: 68
  • Errors: 38

💡 To execute import, run without --preview flag
```

---

#### Merge Mode - הוספת חדשים בלבד (ברירת מחדל)
```powershell
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --mode merge
```

**מה קורה:**
- ✅ מוסיף אתרים חדשים
- ⏭️ מדלג על אתרים קיימים (לפי שם)
- 📝 שומר log file אוטומטית

**תוצאה:**
```
🔀 MERGE MODE - Adding new sites, keeping existing
================================================

✅ Added 15 new sites
⏭️  Skipped 68 duplicate sites

📊 FINAL STATUS:
  • Total sites in DB: 90

📝 Log saved to: /app/import_20260111_143022.log
```

---

#### Replace Mode - מחיקה ויבוא מחדש
```powershell
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --mode replace
```

**⚠️ אזהרה:** מוחק את כל האתרים הקיימים!

**מתאים ל:**
- איפוס מלא של הנתונים
- תיקון שגיאות גדולות
- יבוא ראשוני

**תוצאה:**
```
🔄 REPLACE MODE - Deleting existing and importing fresh
================================================

🗑️  Deleting 75 existing sites...
✅ Deleted existing sites
✅ Imported 83 new sites

📊 FINAL STATUS:
  • Total sites in DB: 83
```

---

#### קובץ Excel מותאם אישית
```powershell
# העתק קובץ אחר
docker cp my_custom_sites.xlsx omeropsmap_data_server:/app/custom.xlsx

# Import עם נתיב מותאם
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --file /app/custom.xlsx
```

---

#### שמירת Log לקובץ ספציפי
```powershell
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py \
  --log-file /app/import_backup_2026-01-11.log
```

---

### 📖 Help - כל האופציות

```powershell
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --help
```

---

## 📊 פורמט קובץ Excel

### שדות חובה:

| שם עמודה (אפשרויות) | סוג | דוגמה | הערות |
|---------------------|-----|--------|-------|
| **אתר** / שם אתר / שם | טקסט | "גן ילדים שקד" | **חובה** - שם ייחודי |
| **קו רוחב** / רוחב / X | מספר | 219529.584 | **חובה** - ITM format |
| **קו אורך** / אורך / Y | מספר | 626907.39 | **חובה** - ITM format |

### שדות אופציונליים:

| שם עמודה | סוג | דוגמה |
|----------|-----|--------|
| קטגוריה / קטגוריה ראשית | טקסט | "חינוך" |
| תת קטגוריה / תת-קטגוריה | טקסט | "גן ילדים" |
| סוג אתר / סוג | טקסט | "ציבורי" |
| רובע / אזור / שכונה | טקסט | "רובע א'" |
| רחוב / שם רחוב | טקסט | "הרצל" |
| מספר בית / מספר | טקסט | "15" |
| טלפון איש קשר / טלפון | טקסט | "08-1234567" |
| איש קשר / אחראי | טקסט | "יוסי כהן" |
| תיאור כללי / תיאור / הערות | טקסט | "גן ילדים עם 4 כיתות" |

---

### 🗺️ מערכת קואורדינטות

המערכת מקבלת קואורדינטות ב-**ITM (Israel TM Grid - EPSG:2039)** וממירה אוטומטית ל-WGS84.

**דוגמה:**
```
ITM:    X=219529.584, Y=626907.39
      ↓ המרה אוטומטית
WGS84:  lat=31.2632, lng=34.8419
```

**איך לקבל קואורדינטות ITM:**
- Google Maps: לחץ ימני → "מה יש כאן?" → העתק
- GIS software: ייצוא ב-EPSG:2039

---

### 📝 דוגמת Excel

| אתר | קטגוריה | תת קטגוריה | רובע | רחוב | מספר בית | קו רוחב | קו אורך | טלפון איש קשר | איש קשר |
|-----|----------|------------|------|------|---------|---------|---------|--------------|---------|
| גן ילדים שקד | חינוך | גן ילדים | רובע א' | הרצל | 15 | 219529.584 | 626907.39 | 08-1234567 | יוסי כהן |
| פארק המייסדים | פארקים | פארק שכונתי | רובע ב' | הנשיא | - | 219600.123 | 626950.45 | - | - |

---

## ⚠️ שגיאות נפוצות ופתרונות

### 1. "Excel file not found"

**שגיאה:**
```
❌ Excel file not found: /app/sites.xlsx
```

**פתרון:**
```powershell
# וודא שהעתקת את הקובץ
docker cp front/public/sites.xlsx omeropsmap_data_server:/app/sites.xlsx
```

---

### 2. "Missing coordinates"

**שגיאה:**
```
⚠️  Row 15: Missing coordinates, skipping
```

**סיבות:**
- עמודת X או Y ריקה
- ערכים לא מספריים

**פתרון:**
- בדוק ש-X ו-Y מלאים בכל השורות
- וודא שהערכים מספריים (לא טקסט)

---

### 3. "Missing name"

**שגיאה:**
```
⚠️  Row 23: Missing name, skipping
```

**פתרון:**
- כל אתר חייב שם
- בדוק שעמודת "אתר" לא ריקה

---

### 4. "Invalid coordinates"

**שגיאה:**
```
⚠️  Row 42: Invalid coordinates (0, 0), skipping
```

**סיבות:**
- קואורדינטות מחוץ לטווח הגיוני
- קואורדינטות (0, 0)

**פתרון:**
- וודא שהקואורדינטות ב-ITM format
- טווח תקין: X ≈ 150000-250000, Y ≈ 500000-750000

---

### 5. שמות כפולים

**הודעה:**
```
⏭️  Skipped 15 duplicate sites
```

**מה קורה:**
- במצב `merge`, אתרים עם שם זהה מדולגים
- השם הוא המזהה הייחודי

**פתרון:**
- אם רוצה לעדכן קיימים: השתמש ב-`--mode replace`
- או: שנה שמות לייחודיים

---

## 💡 Best Practices

### 1. תמיד הרץ Preview קודם
```powershell
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --preview
```
- רואה מה ישתנה לפני ביצוע
- מזהה שגיאות מוקדם

---

### 2. גבה את ה-DB לפני Replace
```powershell
# Backup
docker exec omeropsmap_postgres pg_dump -U omeropsmap omeropsmap > backup_2026-01-11.sql

# Import
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --mode replace

# אם משהו השתבש - Restore
docker exec -i omeropsmap_postgres psql -U omeropsmap omeropsmap < backup_2026-01-11.sql
```

---

### 3. שמור Logs
```powershell
# Logs נשמרים אוטומטית ב-/app/import_TIMESTAMP.log

# להוריד log למחשב
docker cp omeropsmap_data_server:/app/import_20260111_143022.log ./logs/
```

---

### 4. בדוק תוצאות
```powershell
# כמה אתרים יש ב-DB?
docker exec omeropsmap_postgres psql -U omeropsmap -d omeropsmap -c "SELECT COUNT(*) FROM permanent_sites;"

# רשימת 10 אתרים אחרונים
docker exec omeropsmap_postgres psql -U omeropsmap -d omeropsmap -c "SELECT id, name, category FROM permanent_sites ORDER BY created_at DESC LIMIT 10;"
```

---

### 5. נקה קבצים זמניים
```powershell
# מחק Excel files ישנים מה-container
docker exec omeropsmap_data_server rm /app/*.xlsx

# מחק logs ישנים (שמור קודם!)
docker exec omeropsmap_data_server rm /app/import_*.log
```

---

## 🔄 תהליך עבודה מומלץ

### עדכון שגרתי (Merge):
```powershell
# 1. Preview
docker cp new_sites.xlsx omeropsmap_data_server:/app/sites.xlsx
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --preview

# 2. אם הכל נראה טוב - Import
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --mode merge

# 3. בדוק
curl http://localhost:8001/api/permanent-sites | jq 'length'
```

---

### איפוס מלא (Replace):
```powershell
# 1. Backup
docker exec omeropsmap_postgres pg_dump -U omeropsmap omeropsmap > backup.sql

# 2. Preview
docker cp full_data.xlsx omeropsmap_data_server:/app/sites.xlsx
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --preview

# 3. Replace
docker exec omeropsmap_data_server python scripts/import_excel_to_db.py --mode replace

# 4. בדוק
curl http://localhost:8001/api/permanent-sites | jq '.[0:3]'
```

---

## 🌐 שיטה 3: API Direct (למתקדמים)

### Preview Import:

```bash
curl -X POST "http://localhost:8001/api/admin/import/preview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@sites.xlsx"
```

**תגובה:**
```json
{
  "total_rows": 121,
  "valid_sites": 83,
  "errors": ["⚠️  Row 15: Missing coordinates", ...],
  "new_sites": ["גן ילדים שקד", ...],
  "duplicate_sites": ["פארק המייסדים", ...],
  "current_db_count": 75
}
```

### Execute Import:

```bash
curl -X POST "http://localhost:8001/api/admin/import/execute?mode=merge" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@sites.xlsx"
```

**תגובה:**
```json
{
  "success": true,
  "message": "Import completed successfully in merge mode",
  "sites_added": 15,
  "sites_deleted": 0,
  "sites_skipped": 68,
  "total_in_db": 90
}
```

---

## 🚀 תכונות עתידיות

### בפיתוח:
- 🔄 **Update Mode**
  - עדכון אתרים קיימים לפי ID
  - Merge חכם של שדות

- 📊 **Import History**
  - טבלה ב-DB עם היסטוריה
  - מי עשה import ומתי
  - Rollback capabilities

- 📈 **Analytics Dashboard**
  - גרפים של שינויים לאורך זמן
  - דוחות import

---

## 📞 תמיכה

**בעיות?** פתח issue או פנה למפתח.

**רוצה לתרום?** Pull requests מתקבלים בברכה!

---

**עודכן לאחרונה:** 2026-01-11  
**גרסה:** 2.0 (Enhanced CLI)
