
# 🤖 OmerOpsMap – AI Agent (Backend + MCP)

> **סטטוס:** בפיתוח פעיל | **למיזוג עתידי** עם המערכת הראשית

## 📋 סקירה כללית

**AI Agent** הוא שירות עצמאי שיספק יכולות AI למערכת OmerOpsMap.

### רכיבים:
- **Backend (AI Agent)**: FastAPI server שמנהל LangGraph logic, state ו-decision-making
- **MCP Servers**: שירותים מודולריים שמספקים כלים כמו web search וחישובים מתמטיים
- **Frontend**: ממשק lightweight (HTML/JS) לאינטראקציה בזמן אמת


---

## 🔗 Integration עם המערכת הראשית

### Ports Allocation (למניעת קונפליקטים):
```
5173  ➜  Frontend (React/Vite)         - המערכת הראשית
8001  ➜  Data Server (FastAPI)         - המערכת הראשית
8000  ➜  AI Agent (FastAPI)            - ⚠️ שמור לשירות זה!
5432  ➜  PostgreSQL                    - משותף
3333  ➜  Web Search MCP                - שירות זה
3334  ➜  Math MCP                      - שירות זה
```

### נקודות אינטגרציה עתידיות:
1. **Database Sharing**: אפשרות לשתף את אותו PostgreSQL
2. **API Communication**: קריאות בין data_server ל-AI agent
3. **WebSocket Coordination**: סנכרון התראות בזמן אמת
4. **Authentication**: שיתוף JWT tokens למשתמשים

### Frontend ChatBot מוכן לחיבור:
המערכת הראשית כוללת כעת קומפוננטת ChatBot מוכנה:
- **מיקום:** `front/src/components/ChatBot.jsx`
- **API Service:** `front/src/api/chatService.js`
- **נקודת חיבור:** `http://localhost:8000/chat` (לפי ברירת מחדל)
- **Environment Variable:** `VITE_AI_AGENT_URL` - ניתן לשנות ב-`front/.env`

#### API Endpoints שהקומפוננטה מצפה להם:
1. **POST /chat** - שליחת מסר לAI Agent
   ```json
   Request:
   {
     "message": "שאלה של משתמש",
     "session_id": "session_123456"
   }
   
   Response:
   {
     "response": "תשובת ה-AI",
     "timestamp": "2026-01-11T10:30:00"
   }
   ```

2. **GET /health** - בדיקת זמינות השירות
   ```json
   Response:
   {
     "status": "ok"
   }
   ```

3. **WebSocket /ws/chat?session_id=xxx** (אופציונלי - לעתיד)
   - Real-time streaming של תשובות
   - Typing indicators
   - Notifications

---

## 📁 Repository Structure
OmerOpsMap/
├── back/                           # Backend - AI Agent & API
│   ├── Ai_agent/                   # Main Agent logic
│   │   ├── graph/                  # LangGraph architecture
│   │   │   ├── agents/             # Agent definitions (e.g., tool_router.py)
│   │   │   ├── chains/             # LLM chains and logic (e.g., moderation.py)
│   │   │   ├── mcp/                # MCP client and tool integrations
│   │   │   ├── nodes/              # Graph execution nodes (e.g., moderate.py)
│   │   │   ├── prompts/            # System and tool prompts
│   │   │   ├── graph.py            # Main LangGraph flow definition
│   │   │   └── state.py            # GraphState definition
│   │   ├── .env                    # Agent environment variables (API Keys)
│   │   ├── ingestion.py            # RAG pipeline for loading municipal data
│   │   ├── main.py                 # FastAPI server entry point
│   │   └── pyproject.toml          # Poetry dependencies for the backend
│   │
│   └── MCP_servers/                # Specialized MCP Servers
│       ├── math/                   # Math Logic Server (Port 3334)
│       │   ├── server.py           # Math logic implementation
│       │   └── pyproject.toml      # Math server dependencies
│       └── web_search/             # Web Search Server (Tavily - Port 3333)
│           ├── server.py           # Tavily search implementation
│           └── .env                # Tavily API key
│
└── front/                          # Frontend - User Interface
    ├── index.html                  # Chat interface structure
    ├── styles.css                  # UI styling
    └── app.js                      # Client-side logic for API communication



### System
- Windows 10 / 11 (נבדק עם PowerShell)
- Python **3.12+**
- Poetry

### API Keys
- **OPENAI_API_KEY** – for gpt-4o-mini
- **TAVILY_API_KEY** – for Web Search MCP

---

## Setup – Backend (Ai_agent)

```powershell
cd back\Ai_agent
poetry install

back/Ai_agent/.env:
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here

Web Search MCP Server
New Terminal: 
cd back\MCP_servers\web_search
poetry install
poetry run python server.py
Will listening http://localhost:3333/mcp

Math MCP Server
New Terminal: 
cd back\MCP_servers\math
poetry install
poetry run python server.py
Will listening http://localhost:3334/mcp

New Terminal: 
cd back
netstat -ano | findstr :3333
netstat -ano | findstr :3334
Check servers

New Terminal: 
cd back\Ai_agent
poetry run uvicorn server:app --host 0.0.0.0 --port 8000 --reload

New Terminal:
curl http://localhost:8000/health
Need to return - {"status":"ok"}


# OmerOpsMap – AI Agent (Backend + MCP + Simple Front)
cd front
python -m http.server 5173
Then open http://localhost:5173

---

## 🚀 הרצה Standalone (למפתחים)

אם אתה רוצה להריץ את ה-AI Agent בנפרד לצורך פיתוח:

```powershell
# 1. הפעל MCP servers
cd back\MCP_servers\web_search
poetry run python server.py

# בטרמינל נפרד
cd back\MCP_servers\math
poetry run python server.py

# 2. הפעל AI Agent
cd back\Ai_agent
poetry run uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# 3. בדוק שהכל עובד
curl http://localhost:8000/health
curl http://localhost:3333/mcp
curl http://localhost:3334/mcp
```

---

## 📝 Environment Variables נדרשים

צור קובץ `back/Ai_agent/.env`:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATA_SERVER_URL=http://localhost:8001  # אם צריך לתקשר עם data_server
```

---

## 🔄 מיזוג עתידי ל-docker-compose הראשי

כאשר השירות יהיה מוכן, להוסיף ל-`docker-compose.yml` הראשי:

```yaml
ai_agent:
  build: ./back/Ai_agent
  container_name: omeropsmap_ai_agent
  ports:
    - "8000:8000"
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - TAVILY_API_KEY=${TAVILY_API_KEY}
    - DATA_SERVER_URL=http://data_server:8001
  depends_on:
    - data_server
  restart: unless-stopped

web_search_mcp:
  build: ./back/MCP_servers/web_search
  container_name: omeropsmap_web_search
  ports:
    - "3333:3333"
  environment:
    - TAVILY_API_KEY=${TAVILY_API_KEY}
  restart: unless-stopped

math_mcp:
  build: ./back/MCP_servers/math
  container_name: omeropsmap_math
  ports:
    - "3334:3334"
  restart: unless-stopped
```

---

## 📞 יצירת קשר

למידע נוסף או שאלות לגבי האינטגרציה, פנה למפתח האחראי על AI Agent.
