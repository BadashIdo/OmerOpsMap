# 📊 OmerOpsMap - Diagrams Collection

> All diagrams without explanations - ready to export as images

---

## 1. System Architecture - Full Overview

```mermaid
graph TB
    subgraph Frontend["Frontend - React (Port 5173)"]
        UI[User Interface]
        MapUI[Map + Markers]
        ChatUI[Chat Component]
        AdminUI[Admin Panel]
    end
    
    subgraph DataServer["Data Server - FastAPI (Port 8001)"]
        DataAPI[REST API]
        WS[WebSocket]
        Auth[JWT Auth]
        Repo[Repository]
        BG[Background Jobs]
    end
    
    subgraph AIAgent["AI Agent - LangGraph (Port 8000)"]
        AgentAPI[Agent API]
        Graph[LangGraph Workflow]
        Moderate[Moderation Node]
        ToolAgent[Tool Agent Node]
        Router[Tool Router]
    end
    
    subgraph MCP["MCP Servers"]
        WebMCP[Web Search MCP<br/>Port 3333]
        MathMCP[Math MCP<br/>Port 3334]
    end
    
    subgraph Storage["Storage"]
        PG[(PostgreSQL<br/>Sites Data)]
        Session[SessionStorage<br/>Auth Tokens]
    end
    
    UI --> MapUI
    UI --> ChatUI
    UI --> AdminUI
    MapUI -->|GET /api/sites| DataAPI
    AdminUI -->|POST/PUT/DELETE<br/>JWT Auth| DataAPI
    MapUI -.->|WebSocket<br/>Real-time| WS
    ChatUI -->|POST /ask<br/>POST /ask/stream| AgentAPI
    DataAPI --> Auth
    Auth --> Repo
    Repo --> PG
    BG --> Repo
    WS -.-> MapUI
    AgentAPI --> Graph
    Graph --> Moderate
    Moderate -->|allowed| ToolAgent
    Moderate -->|blocked| AgentAPI
    ToolAgent --> Router
    Router -->|async| WebMCP
    Router -->|async| MathMCP
    Auth -.-> Session
    
    style Frontend fill:#e3f2fd
    style DataServer fill:#fff3e0
    style AIAgent fill:#f3e5f5
    style MCP fill:#e8f5e9
    style Storage fill:#fce4ec
```

---

## 2. Data Flow - Complete System

```mermaid
graph LR
    subgraph Client
        U[User Browser]
    end
    
    subgraph React
        MapComp[Map Components]
        ChatComp[Chat Component]
        AdminComp[Admin Panel]
    end
    
    subgraph DataSrv[Data Server 8001]
        RestAPI[REST API]
        WSock[WebSocket]
    end
    
    subgraph AISrv[AI Agent 8000]
        AgentAPI[Agent API]
        LGraph[LangGraph]
    end
    
    subgraph Tools
        MCP1[Web MCP]
        MCP2[Math MCP]
    end
    
    subgraph DB
        Postgres[(PostgreSQL)]
    end
    
    U --> MapComp
    U --> ChatComp
    U --> AdminComp
    
    MapComp <-->|Sites Data| RestAPI
    MapComp <-.->|Real-time| WSock
    AdminComp -->|CRUD| RestAPI
    ChatComp -->|Questions| AgentAPI
    
    RestAPI <--> Postgres
    WSock -.-> MapComp
    
    AgentAPI --> LGraph
    LGraph --> MCP1
    LGraph --> MCP2
```

---

## 3. UC1: Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as LoginPage
    participant AC as AuthContext
    participant API as Backend API
    participant DB as PostgreSQL
    
    U->>LP: פותח אפליקציה
    LP->>AC: בודק sessionStorage
    AC-->>LP: אין token/guest
    LP->>U: מציג: אורח או מנהל?
    
    alt בחירה: אורח
        U->>LP: לוחץ "כניסה כאורח"
        LP->>AC: enterAsGuest()
        AC->>sessionStorage: שומר "omeropsmap_guest"
        LP->>U: עובר ל-AppContent
    else בחירה: מנהל
        U->>LP: לוחץ "כניסה כמנהל"
        LP->>U: מציג טופס username/password
        U->>LP: מזין פרטים
        LP->>API: POST /api/auth/login
        API->>DB: SELECT * FROM admins WHERE username=?
        DB-->>API: מחזיר admin + password_hash
        API->>API: bcrypt.verify(password, hash)
        API->>API: create_access_token(JWT)
        API-->>LP: {token, admin_info}
        LP->>AC: login(token, admin)
        AC->>sessionStorage: שומר token + admin
        LP->>U: עובר ל-AppContent
    end
```

---

## 4. UC2: Data Loading

```mermaid
sequenceDiagram
    participant AC as AppContent
    participant H1 as useSites Hook
    participant H2 as useTemporarySites
    participant DS as dataService
    participant API as FastAPI
    participant DB as PostgreSQL
    
    AC->>H1: mount + dataRefreshTrigger
    H1->>DS: fetchPermanentSites()
    DS->>API: GET /api/permanent-sites
    API->>DB: SELECT * FROM permanent_sites
    DB-->>API: rows[]
    API-->>DS: JSON response
    DS->>H1: transform (snake_case → camelCase)
    H1-->>AC: setPoints(sites)
    
    par טעינה מקבילה
        AC->>H2: mount + dataRefreshTrigger
        H2->>DS: fetchTemporarySites()
        DS->>API: GET /api/temporary-sites
        API->>DB: SELECT * FROM temporary_sites WHERE status='active'
        DB-->>API: rows[]
        API-->>DS: JSON response
        H2-->>AC: setTemporarySites(events)
    end
    
    AC->>AC: מציג markers על המפה
```

---

## 5. UC3: User Request Submission

```mermaid
sequenceDiagram
    participant U as User (Guest/Admin)
    participant Map as MapView
    participant RF as RequestForm
    participant DS as dataService
    participant API as Backend
    participant DB as PostgreSQL
    participant WS as WebSocket
    
    U->>Map: לחיצה ארוכה (600ms) על מיקום
    Map->>Map: MapLongPressHandler
    Map->>RF: פותח modal עם lat/lng
    U->>RF: ממלא: סוג, שם, תיאור, קטגוריה
    U->>RF: תאריכים (אם זמני), דחיפות
    U->>RF: פרטי מדווח (שם, טלפון/אימייל)
    RF->>RF: validation
    RF->>DS: submitRequest(data)
    DS->>API: POST /api/requests (ללא auth!)
    API->>DB: INSERT INTO site_requests (status='pending')
    DB-->>API: request_id
    API->>WS: broadcast({type:"new_request"})
    WS-->>All Admins: התראה חדשה!
    API-->>RF: {success, request_id}
    RF->>U: "הבקשה נשלחה בהצלחה!"
```

---

## 6. UC4: Admin Approve/Reject Request

```mermaid
sequenceDiagram
    participant A as Admin
    participant AP as AdminPanel
    participant RT as RequestsTab
    participant RM as RequestReviewModal
    participant API as Backend
    participant DB as DB
    participant WS as WebSocket
    
    A->>AP: פותח פאנל ניהול
    AP->>API: GET /api/requests/pending (עם JWT)
    API->>DB: SELECT * FROM site_requests WHERE status='pending'
    DB-->>API: requests[]
    API-->>RT: מציג רשימת בקשות
    
    A->>RT: לוחץ על בקשה
    RT->>RM: פותח modal עם פרטים מלאים
    A->>RM: (אופציונלי) עורך שדות
    RM->>API: PUT /api/requests/{id}
    
    alt מאשר
        A->>RM: לוחץ "אשר והוסף למפה"
        RM->>API: POST /api/requests/{id}/approve
        API->>DB: BEGIN TRANSACTION
        API->>DB: INSERT INTO temporary_sites OR permanent_sites
        API->>DB: UPDATE site_requests SET status='approved'
        API->>DB: COMMIT
        API->>WS: broadcast({type:"data_changed", action:"create"})
        WS-->>All Users: רענון אוטומטי!
        API-->>RM: success
        RM->>A: "הבקשה אושרה והאתר נוסף"
    else דוחה
        A->>RM: לוחץ "דחה"
        RM->>A: "הזן סיבת דחייה"
        A->>RM: כותב סיבה
        RM->>API: POST /api/requests/{id}/reject {reason}
        API->>DB: UPDATE site_requests SET status='rejected', admin_notes=?
        API->>WS: broadcast({type:"request_rejected"})
        API-->>RM: success
    end
```

---

## 7. UC5: WebSocket Real-time Updates

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant A as Admin
    participant WS as WebSocket Manager
    participant API as API Endpoint
    
    U1->>WS: connect() on mount
    U2->>WS: connect() on mount
    A->>WS: connect() on mount
    WS-->>All: connected ✓
    
    A->>API: POST /api/temporary-sites (create)
    API->>API: create_temporary_site()
    API->>WS: notify_data_changed("temporary", "create", {...})
    WS->>WS: broadcast to all connections
    WS-->>U1: {type:"data_changed", data_type:"temporary"}
    WS-->>U2: {type:"data_changed", data_type:"temporary"}
    WS-->>A: {type:"data_changed", data_type:"temporary"}
    
    U1->>U1: setDataRefreshTrigger(prev + 1)
    U1->>API: GET /api/temporary-sites (refresh)
    U1->>U1: מציג notification "אירוע זמני נוסף: ..."
    
    U2->>U2: same...
```

---

## 8. UC6: Expiry Scheduler

```mermaid
sequenceDiagram
    participant S as APScheduler
    participant ES as ExpiryScheduler
    participant Repo as Repository
    participant DB as PostgreSQL
    participant WS as WebSocket
    
    loop כל דקה
        S->>ES: run job
        ES->>Repo: archive_expired()
        Repo->>DB: SELECT * FROM temporary_sites WHERE end_date < NOW()
        DB-->>Repo: expired_events[]
        
        loop for each expired
            Repo->>DB: INSERT INTO temporary_history
            Repo->>DB: DELETE FROM temporary_sites
            Repo->>WS: notify("temporary", "expired", {...})
        end
        
        Repo-->>ES: archived_count
        ES->>ES: log("Archived X events")
    end
    
    WS-->>All Users: {type:"data_changed", action:"expired"}
    Users->>Users: רענון + notification
```

---

## 9. UC7: Admin CRUD Operations

```mermaid
graph LR
    A[Admin Panel] --> B[Permanent Sites Tab]
    A --> C[Temporary Sites Tab]
    
    B --> D[View Table]
    B --> E[Search/Filter]
    B --> F[Edit Modal]
    B --> G[Delete]
    B --> H[Add New]
    
    F --> I[Update API]
    G --> J[Delete API]
    H --> K[Create API]
    
    I -->|JWT| L[Backend]
    J -->|JWT| L
    K -->|JWT| L
    
    L --> M[Repository]
    M --> N[(Database)]
    L --> O[WebSocket Broadcast]
```

---

## 10. UC8: Logout Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Btn as Exit Button
    participant SS as sessionStorage
    participant W as Window
    
    U->>Btn: לוחץ "יציאה"
    Btn->>U: confirm dialog
    U->>Btn: מאשר
    Btn->>SS: clear() - מוחק הכל
    Note over SS: omeropsmap_token ✗<br/>omeropsmap_admin ✗<br/>omeropsmap_guest ✗
    Btn->>W: location.reload()
    W->>W: טוען מחדש
    W->>AuthContext: בודק sessionStorage
    AuthContext-->>W: ריק!
    W->>LoginPage: מציג דף בחירה
```

---

## 11. UC9: AI Chat Flow (NEW)

```mermaid
sequenceDiagram
    participant U as User
    participant ChatUI as Chat Component
    participant Agent as AI Agent (8000)
    participant LG as LangGraph
    participant MCP as MCP Servers
    participant LLM as OpenAI GPT-4o
    
    U->>ChatUI: כותב שאלה
    ChatUI->>Agent: POST /ask/stream
    Agent->>LG: ainvoke(query)
    
    LG->>LG: Moderate Node
    alt Not Allowed
        LG-->>ChatUI: "שאלה לא מתאימה"
    else Allowed
        LG->>LG: Tool Agent Node
        LG->>LG: Router - איזה tools?
        
        par כלים במקביל
            LG->>MCP: Web Search (אם צריך)
            LG->>MCP: Math (אם צריך)
        end
        
        MCP-->>LG: תוצאות
        LG->>LLM: שאלה + תוצאות כלים
        LLM-->>LG: תשובה
        LG-->>Agent: final_answer
        Agent-->>ChatUI: Stream tokens
        ChatUI->>U: מציג תשובה בזמן אמת
    end
```

---

## 12. LangGraph Workflow

```mermaid
graph TD
    Start([START]) --> Moderate[Moderate Node]
    Moderate -->|is_allowed=True| ToolAgent[Tool Agent Node]
    Moderate -->|is_allowed=False| End1([END - Blocked])
    
    ToolAgent --> Router{Tool Router}
    Router -->|Web Search| WebMCP[Web MCP 3333]
    Router -->|Math| MathMCP[Math MCP 3334]
    Router -->|None| LLM[LLM Only]
    
    WebMCP --> Combine[Combine Results]
    MathMCP --> Combine
    LLM --> Combine
    
    Combine --> GPT[GPT-4o-mini]
    GPT --> End2([END - Answer])
    
    style Start fill:#e8f5e9
    style End1 fill:#ffebee
    style End2 fill:#e3f2fd
    style Moderate fill:#fff3e0
    style ToolAgent fill:#f3e5f5
```

---

## 13. Component Hierarchy

```mermaid
graph TB
    App[App AuthProvider] --> Login[LoginPage]
    App --> Content[AppContent]
    
    Content --> SideBar
    Content --> SearchBar
    Content --> MapView
    Content --> Chat
    Content --> TempPanel[TemporaryEventsPanel]
    Content --> AdminPanel
    Content --> RequestForm
    Content --> Notifications[NotificationToast]
    
    MapView --> PermMarkers[Permanent Markers]
    MapView --> TempMarkers[Temporary Markers]
    MapView --> LongPress[MapLongPressHandler]
    
    AdminPanel --> ReqTab[RequestsTab]
    AdminPanel --> PermTab[PermanentSitesTab]
    AdminPanel --> TempTab[TemporarySitesTab]
    
    ReqTab --> ReviewModal[RequestReviewModal]
    PermTab --> EditModal1[SiteEditModal]
    TempTab --> EditModal2[SiteEditModal]
    
    style App fill:#e3f2fd
    style Content fill:#fff3e0
    style AdminPanel fill:#f3e5f5
```

---

## 14. Database Schema

```mermaid
erDiagram
    PERMANENT_SITES {
        int id PK
        string name
        string category
        string sub_category
        float lat
        float lng
        datetime created_at
    }
    
    TEMPORARY_SITES {
        int id PK
        string name
        string category
        float lat
        float lng
        datetime end_date
        string priority
        string status
    }
    
    TEMPORARY_HISTORY {
        int id PK
        string name
        datetime end_date
        datetime archived_at
    }
    
    ADMINS {
        int id PK
        string username UK
        string password_hash
        datetime last_login
    }
    
    SITE_REQUESTS {
        int id PK
        string request_type
        bool is_temporary
        string name
        float lat
        float lng
        string status
        int reviewed_by FK
        datetime created_at
    }
    
    ADMINS ||--o{ SITE_REQUESTS : reviews
    TEMPORARY_SITES ||--o| TEMPORARY_HISTORY : archives_to
```

---

## 15. End-to-End Data Flow

```mermaid
sequenceDiagram
    participant U as Admin
    participant UI as AdminPanel
    participant API as Data Server 8001
    participant Repo as Repository
    participant DB as PostgreSQL
    participant WS as WebSocket
    participant C1 as Client 1
    participant C2 as Client 2
    
    U->>UI: Creates new temp event
    UI->>API: POST /api/temporary-sites + JWT
    API->>API: Verify JWT
    API->>Repo: create(data)
    Repo->>DB: INSERT INTO temporary_sites
    DB-->>Repo: new_event
    Repo-->>API: event_created
    API->>WS: broadcast(event_created)
    API-->>UI: 201 Created
    
    WS->>C1: data_changed
    WS->>C2: data_changed
    
    C1->>API: GET /api/temporary-sites
    C2->>API: GET /api/temporary-sites
    
    API->>DB: SELECT * FROM temporary_sites
    DB-->>API: all_events
    API-->>C1: events[]
    API-->>C2: events[]
    
    C1->>C1: Update map + show toast
    C2->>C2: Update map + show toast
```

---

**End of Diagrams Collection**
*Ready to export as PNG/SVG images*

