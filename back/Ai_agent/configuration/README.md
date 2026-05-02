# Configuration

כל הגדרות הסוכן במקום אחד — מודלים, טמפרטורות, ופרומפטים.

---

## קבצים

| קובץ | תפקיד |
|---|---|
| `config_llm.yaml` | מודל וטמפרטורה לכל LLM במערכת |
| `loader.py` | טוען את ה-YAML עם cache, מחזיר config לפי מפתח |
| `prompts/` | כל הפרומפטים של המערכת |

---

## prompts/

| קובץ | פרומפט | היכן משמש |
|---|---|---|
| `moderation_gate.py` | `MODERATION_SYSTEM_PROMPT` | `graph/chains/moderation.py` — שומר סף: מה מותר/אסור לעיבוד |
| `tool_selection.py` | `TOOL_SELECTION_SYSTEM`, `TOOL_SELECTION_HUMAN`, `AVAILABLE_CATEGORIES` | `graph/chains/tool_router.py` — בחירת כלים + קטגוריות + שם מקום בקריאת LLM אחת |
| `citizen_assistant.py` | `CITIZEN_ASSISTANT_SYSTEM`, `CITIZEN_ASSISTANT_HUMAN` | `graph/nodes/tool_agent.py` — העוזר העירוני שמייצר את התשובה הסופית בעברית |

---

## config_llm.yaml

שנה כאן מודל או טמפרטורה — השינוי ישפיע על כל המערכת בלי לגעת בקוד.

```yaml
main_llm:          # תשובה סופית לתושב
tool_router_llm:   # בחירת כלים + קטגוריות
moderation_llm:    # בדיקת תוכן
```

מודלים זמינים מפורטים בתחתית ה-YAML.
