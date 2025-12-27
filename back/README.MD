
# OmerOpsMap – AI Agent (Backend + MCP + Simple Front)
Frontend: A lightweight, static web interface (HTML/JS) for real-time user interaction.


Backend (AI Agent): A FastAPI server that orchestrates the LangGraph logic, managing state and decision-making.


MCP Servers: Independent, modular services that provide the agent with specific tools like real-time web search and mathematical calculations.


## Repository Structure
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
