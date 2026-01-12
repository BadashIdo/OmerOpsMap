# 🏗️ OmerOpsMap - ארכיטכטורה מלאה

> מסמך זה מסביר את כל הארכיטקטורה, Data Flow, ו-Use Cases של מערכת OmerOpsMap

## תוכן עניינים
- [תמונה כללית](#תמונה-כללית)
- [Database Schema](#database-schema)
- [Use Cases](#use-cases)
  - [UC1: כניסה למערכת](#use-case-1-כניסה-למערכת-login-flow)
  - [UC2: טעינת נתונים](#use-case-2-טעינת-נתונים-data-loading)
  - [UC3: הגשת בקשה](#use-case-3-הגשת-בקשה-user-request-submission)
  - [UC4: אישור/דחיית בקשה](#use-case-4-אדמין-מאשרדוחה-בקשה)
  - [UC5: עדכונים בזמן אמת](#use-case-5-עדכונים-בזמן-אמת-websocket)
  - [UC6: Expiry Scheduler](#use-case-6-expiry-scheduler-background-job)
  - [UC7: ניהול אתרים](#use-case-7-ניהול-אתרים-admin-crud)
  - [UC8: יציאה מהמערכת](#use-case-8-יציאה-וחזרה-לבחירה)
- [Security Layer](#security-layer)
- [Repository Pattern](#repository-pattern)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow Example](#data-flow-example---מקצה-לקצה)

---

## תמונה כללית - Stack טכנולוגי

```mermaid
graph TB
    subgraph Client["Frontend - React + Vite"]
        UI[Components]
        State[Context/Hooks]
        API_Client[API Service]
    end
    
    subgraph Server["Backend - FastAPI"]
        REST[REST Endpoints]
        WS[WebSocket]
        Auth[JWT Auth]
        Repo[Repository Layer]
        BG[Background Jobs]
    end
    
    subgraph Storage["Data Layer"]
        PG[(PostgreSQL)]
        Session[SessionStorage]
    end
    
    UI --> State
    State --> API_Client
    API_Client -->|HTTP/WS| REST
    API_Client -->|HTTP/WS| WS
    REST --> Auth
    Auth --> Repo
    Repo --> PG
    BG --> Repo
    WS -.->|Push| API_Client
    Session -.-> State
```

### טכנולוגיות עיקריות

**Backend:**
- **FastAPI** - Web framework מודרני ומהיר עם async support
- **SQLAlchemy 2.0** - ORM עם async support
- **PostgreSQL** - Database יחסי
- **Alembic** - Database migrations
- **python-jose** - JWT tokens
- **bcrypt** - Password hashing
- **APScheduler** - Background jobs
- **WebSockets** - Real-time communication

**Frontend:**
- **React 18** - UI framework
- **Vite** - Build tool מהיר
- **React Leaflet** - Maps
- **CSS Modules** - Scoped styling
- **Context API** - State management
- **Custom Hooks** - Logic reuse

**Infrastructure:**
- **Docker** - Containerization
- **Docker Compose** - Multi-container setup

---

## Database Schema - 5 טבלאות

### 1. permanent_sites - אתרים קבועים
```sql
CREATE TABLE permanent_sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    type VARCHAR(100),
    district VARCHAR(100),
    street VARCHAR(255),
    house_number VARCHAR(20),
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    description TEXT,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

**שימוש:** בתי ספר, פארקים, מוסדות ציבור - דברים שלא משתנים

---

### 2. temporary_sites - אירועים זמניים
```sql
CREATE TABLE temporary_sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    priority VARCHAR(20),  -- low/medium/high/critical
    status VARCHAR(20),     -- active/scheduled/cancelled
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

**שימוש:** חסימות כבישים, אירועים, עבודות זמניות

---

### 3. temporary_history - ארכיון
```sql
CREATE TABLE temporary_history (
    -- Same columns as temporary_sites
    archived_at TIMESTAMP DEFAULT NOW()
);
```

**שימוש:** אירועים שפג תוקפם עוברים לכאן אוטומטית (כל דקה)

---

### 4. admins - מנהלי מערכת
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt
    display_name VARCHAR(100),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
```

**שימוש:** אימות והרשאות למנהלים

---

### 5. site_requests - בקשות ממשתמשים
```sql
CREATE TABLE site_requests (
    id SERIAL PRIMARY KEY,
    request_type VARCHAR(20),  -- hazard/roadwork/event/new_site/correction/other
    is_temporary BOOLEAN DEFAULT TRUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    priority VARCHAR(20),
    -- Submitter info (required)
    submitter_name VARCHAR(100) NOT NULL,
    submitter_phone VARCHAR(20),
    submitter_email VARCHAR(255),
    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending/approved/rejected
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES admins(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**שימוש:** אורחים ואדמינים מדווחים על דברים חדשים → אדמין מאשר/דוחה

---

## Use Cases

### Use Case 1: כניסה למערכת (Login Flow)

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

#### קבצים מעורבים

**Frontend:**
- `front/src/components/LoginPage.jsx` - UI של דף ההתחברות
- `front/src/context/AuthContext.jsx` - State management של אימות
- `front/src/app/App.jsx` - Routing בין Login ל-AppContent

**Backend:**
- `data_server/app/api/auth.py` - Endpoints: `/login`, `/verify`, `/me`
- `data_server/app/repository/admins.py` - Database operations
- `data_server/app/auth/jwt.py` - JWT creation & verification

#### טכנולוגיות

**JWT (JSON Web Tokens):**
```javascript
// Structure
{
  "sub": "1",              // admin_id
  "username": "admin",
  "exp": 1735825200,       // פג תוקף אחרי 24 שעות
  "iat": 1735738800,
  "type": "access"
}
```

**bcrypt Hashing:**
```python
# Password never stored in plain text!
hash_password("mypassword123")
# → "$2b$12$KIXvZ9..."

verify_password("mypassword123", hash)
# → True
```

**sessionStorage vs localStorage:**
- `sessionStorage` - נמחק כשסוגרים דפדפן (טוב יותר לאבטחה)
- `localStorage` - נשאר לנצח

#### למה לא cookies?

Cookies + JWT = קצת יתר מידה. sessionStorage פשוט יותר ל-SPA.

---

### Use Case 2: טעינת נתונים (Data Loading)

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

#### למה רק אחרי Login?

```javascript
// App.jsx structure
function App() {
  return (
    <AuthProvider>
      {!loggedIn ? (
        <LoginPage />  // אין כאן useSites!
      ) : (
        <AppContent />  // רק כאן useSites מופעל
      )}
    </AuthProvider>
  );
}
```

לכן GET requests למידע קורים **רק אחרי בחירה** (אורח או מנהל).

#### Transformation Layer

**למה צריך?** Backend עובד עם Python conventions (snake_case), Frontend עובד עם JavaScript conventions (camelCase).

```javascript
// Backend returns:
{
  sub_category: "בית ספר יסודי",
  house_number: "5"
}

// Frontend transforms to:
{
  subCategory: "בית ספר יסודי",
  houseNumber: "5"
}
```

**איפה זה קורה?** `front/src/hooks/useSites.js`

```javascript
const transformedSites = sites.map((site) => ({
  id: site.id,
  subCategory: site.sub_category,  // 👈 transformation
  houseNumber: site.house_number,
  // ...
}));
```

#### dataRefreshTrigger - איך זה עובד?

```javascript
const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

// useSites runs when trigger changes
const { points } = useSites(dataRefreshTrigger);

// When WebSocket message arrives:
setDataRefreshTrigger(prev => prev + 1);  // triggers re-fetch!
```

זה הטריק לרענון אוטומטי!

---

### Use Case 3: הגשת בקשה (User Request Submission)

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

#### Long Press Detection

**למה 600ms?** מניעת הפעלה בטעות במהלך גלילה/zoom.

```javascript
// MapView.jsx - MapLongPressHandler
function MapLongPressHandler({ onLongPress }) {
  const pressTimerRef = useRef(null);
  const LONG_PRESS_DURATION = 600; // ms

  const handleMouseDown = (e) => {
    pressTimerRef.current = setTimeout(() => {
      onLongPress({ lat: e.latlng.lat, lng: e.latlng.lng });
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = () => {
    clearTimeout(pressTimerRef.current);  // Cancel if released early
  };

  useMapEvents({
    mousedown: handleMouseDown,
    mouseup: handleMouseUp,
    mousemove: handleMouseUp,  // Cancel if moved
  });
}
```

#### Request Types

```javascript
const REQUEST_TYPES = [
  { value: "hazard", label: "מפגע / סכנה", icon: "⚠️" },
  { value: "roadwork", label: "עבודות / חסימה", icon: "🚧" },
  { value: "event", label: "אירוע ציבורי", icon: "🎉" },
  { value: "new_site", label: "אתר חדש", icon: "📍" },
  { value: "correction", label: "תיקון לאתר קיים", icon: "✏️" },
  { value: "other", label: "אחר", icon: "📝" },
];
```

#### Validation Rules

**Frontend validation:**
```javascript
if (!formData.name.trim()) {
  setError("נא להזין שם/כותרת");
  return;
}
if (!formData.submitter_name.trim()) {
  setError("נא להזין את שמך");
  return;
}
if (!formData.submitter_phone && !formData.submitter_email) {
  setError("נא להזין טלפון או אימייל ליצירת קשר");
  return;
}
if (formData.is_temporary && !formData.end_date) {
  setError("נא להזין תאריך סיום לאירוע זמני");
  return;
}
```

**Backend validation:**
```python
# api/site_requests.py
if not request_data.submitter_phone and not request_data.submitter_email:
    raise HTTPException(400, "נדרש למלא טלפון או אימייל")
```

Double validation = safety!

#### נקודות חשובות

- **Public endpoint** - כל אחד יכול להגיש (גם אורחים!)
- **No authentication required** - אבל שומר את פרטי המדווח
- **Real-time notification** - אדמינים מקבלים התראה מיידית דרך WebSocket
- **Pending by default** - status='pending' עד שאדמין מטפל

---

### Use Case 4: אדמין מאשר/דוחה בקשה

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

#### Approval Logic - Transaction Safety

**למה Transaction?** כדי להבטיח שגם האתר נוצר וגם הבקשה מתעדכנת - או ששניהם קורים או ששניהם לא.

```python
# repository/site_requests.py
async def approve(self, request_id: int, admin_id: int):
    request = await self.get_by_id(request_id)
    
    # 1. Create the site
    if request.is_temporary:
        site = TemporarySite(
            name=request.name,
            lat=request.lat,
            lng=request.lng,
            end_date=request.end_date,
            # ...
        )
    else:
        site = PermanentSite(...)
    
    self.session.add(site)
    
    # 2. Update request status
    request.status = RequestStatus.APPROVED
    request.reviewed_by = admin_id
    request.reviewed_at = datetime.now(timezone.utc)
    
    # 3. Commit BOTH together (atomic!)
    await self.session.commit()
    
    return {
        "site_type": "temporary" if request.is_temporary else "permanent",
        "site_id": site.id,
        "site_name": site.name
    }
```

אם `site` נכשל ליצור → rollback אוטומטי, הבקשה לא תשתנה!

#### Rejection with Reason

```python
async def reject(self, request_id: int, admin_id: int, reason: str):
    request = await self.get_by_id(request_id)
    
    request.status = RequestStatus.REJECTED
    request.admin_notes = reason  # המדווח יוכל לראות למה נדחה
    request.reviewed_by = admin_id
    request.reviewed_at = datetime.now(timezone.utc)
    
    await self.session.commit()
    return request
```

#### Admin Panel Structure

```
AdminPanel (Modal)
├─ Header (with logout, admin name)
├─ Tabs
│  ├─ RequestsTab
│  │  ├─ List of cards
│  │  └─ RequestReviewModal
│  ├─ PermanentSitesTab
│  │  ├─ Table view
│  │  ├─ Search/filter
│  │  └─ SiteEditModal
│  └─ TemporarySitesTab
│     ├─ Table view
│     ├─ Search/filter
│     └─ SiteEditModal
└─ Badge (pending count)
```

---

### Use Case 5: עדכונים בזמן אמת (WebSocket)

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

#### WebSocket Architecture

**Backend:**
```python
# app/api/websocket.py
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # Connection broken, remove it
                await self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

**Helper Function:**
```python
async def notify_data_changed(data_type: str, action: str, data: dict):
    """Called from any API endpoint after data change"""
    message = {
        "type": "data_changed",
        "data_type": data_type,  # "permanent" / "temporary" / "request"
        "action": action,         # "create" / "update" / "delete" / "expired"
        "data": data
    }
    await manager.broadcast(message)
```

**Usage in API:**
```python
@router.post("/api/temporary-sites")
async def create_temporary_site(...):
    site = await repo.create(site_data)
    
    # Notify everyone!
    await notify_data_changed("temporary", "create", {
        "id": site.id,
        "name": site.name
    })
    
    return site
```

**Frontend:**
```javascript
// hooks/useWebSocket.js
export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl());
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);  // Call the provided callback
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...");
      // Exponential backoff reconnect
      setTimeout(connect, Math.min(1000 * Math.pow(2, attempts), 30000));
    };
    
    wsRef.current = ws;
    
    return () => ws.close();
  }, [onMessage]);
  
  return { isConnected };
}
```

**App.jsx Integration:**
```javascript
useWebSocket((message) => {
  if (message.type === "data_changed") {
    // Trigger data refresh
    setDataRefreshTrigger(prev => prev + 1);
    
    // Show notification
    const actionText = {
      create: "נוסף",
      update: "עודכן",
      delete: "נמחק",
      expired: "פג תוקפו"
    }[message.action] || "שונה";
    
    const typeText = message.data_type === "temporary" ? "אירוע זמני" : "אתר";
    
    addNotification(`${typeText} ${actionText}: ${message.data?.name || ""}`);
  }
  
  // Special handling for admin notifications
  if (message.type === "data_changed" && 
      message.data_type === "request" && 
      message.action === "new" && 
      isAdmin) {
    addNotification(`בקשה חדשה: ${message.data?.name}`, "info");
    setPendingCount(prev => prev + 1);
  }
});
```

#### למה WebSocket ולא Polling?

**HTTP Polling (בעייתי):**
```javascript
// שולח בקשה כל 5 שניות
setInterval(() => {
  fetch('/api/sites');  // Waste של bandwidth!
}, 5000);
```
- הרבה requests מיותרים
- עיכוב של עד 5 שניות
- עומס על שרת

**WebSocket (מעולה):**
- חיבור פתוח אחד
- עדכון מיידי (< 100ms)
- שרת שולח רק כשיש שינוי

---

### Use Case 6: Expiry Scheduler (Background Job)

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

#### הקוד המלא

**Scheduler Setup:**
```python
# app/services/expiry_scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()

async def archive_expired_events():
    """
    Background job that runs every minute.
    Finds expired temporary events and moves them to history.
    """
    async with AsyncSessionLocal() as session:
        repo = TemporarySitesRepository(session)
        
        # This method does all the work
        archived_events = await repo.archive_expired()
        
        if archived_events:
            print(f"✓ Archived {len(archived_events)} expired events")
            
            # Notify all users
            for event in archived_events:
                await notify_data_changed("temporary", "expired", {
                    "id": event.id,
                    "name": event.name
                })

def start_scheduler():
    """Called from main.py on startup"""
    scheduler.add_job(
        archive_expired_events,
        trigger=IntervalTrigger(minutes=1),
        id='archive_expired',
        name='Archive expired temporary events',
        replace_existing=True
    )
    scheduler.start()
    print("✓ Expiry scheduler started")
```

**Repository Method:**
```python
# repository/temporary_sites.py
async def archive_expired(self) -> List[TemporarySite]:
    """
    Find all expired events, move to history, return what was archived.
    """
    now = datetime.now(timezone.utc)
    
    # Find expired events
    result = await self.session.execute(
        select(TemporarySite).where(
            TemporarySite.end_date < now,
            TemporarySite.status == EventStatus.ACTIVE
        )
    )
    expired_events = list(result.scalars().all())
    
    archived = []
    for event in expired_events:
        # Create history record
        history = TemporaryHistory(
            **{c.name: getattr(event, c.name) 
               for c in event.__table__.columns 
               if c.name != 'id'}
        )
        self.session.add(history)
        
        # Delete from active events
        await self.session.delete(event)
        
        archived.append(event)
    
    if archived:
        await self.session.commit()
    
    return archived
```

**Main App Integration:**
```python
# app/main.py
from app.services.expiry_scheduler import start_scheduler

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    start_scheduler()
    print("✓ Application started")
```

#### למה כל דקה?

- מספיק מהיר (אירוע לא יהיה "פג תוקף" יותר מדקה)
- לא יותר מדי עומס (לא כמו כל 5 שניות)
- Balance טוב בין דיוק לביצועים

#### למה History?

- **Compliance** - לשמור רשומות של מה היה
- **Analytics** - ניתוח מגמות (איזה אירועים נפוצים)
- **Audit** - מי יצר, מתי, למה
- **Recovery** - אפשר לשחזר אם טעו

---

### Use Case 7: ניהול אתרים (Admin CRUD)

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

#### Flow מלא - עריכת אתר

**1. Admin לוחץ "ערוך"**
```javascript
// PermanentSitesTab.jsx
<button onClick={() => setSelectedSite(site)}>
  ✏️ ערוך
</button>
```

**2. פותח Modal**
```javascript
{selectedSite && (
  <SiteEditModal
    site={selectedSite}
    siteType="permanent"
    authHeader={getAuthHeader()}
    onClose={() => setSelectedSite(null)}
    onSave={handleSiteAction}
  />
)}
```

**3. טופס עם נתונים קיימים**
```javascript
// SiteEditModal.jsx
const [formData, setFormData] = useState({
  name: site.name,
  category: site.category,
  lat: site.lat,
  lng: site.lng,
  // ...
});
```

**4. Admin משנה ולוחץ "שמור"**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  await updatePermanentSiteAuth(site.id, formData, authHeader);
  onSave();  // Triggers refresh
};
```

**5. API Request**
```javascript
// dataService.js
export async function updatePermanentSiteAuth(siteId, siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites/${siteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,  // JWT token here!
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error('שגיאה בעדכון האתר');
  }
  return response.json();
}
```

**6. Backend Endpoint**
```python
# api/permanent_sites.py
@router.put("/{site_id}")
async def update_permanent_site(
    site_id: int,
    site_data: PermanentSiteUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)  # JWT verification!
):
    repo = PermanentSitesRepository(db)
    site = await repo.update(site_id, site_data)
    
    if not site:
        raise HTTPException(404, "אתר לא נמצא")
    
    # Notify all users
    await notify_data_changed("permanent", "update", {
        "id": site.id,
        "name": site.name
    })
    
    return site
```

**7. Repository**
```python
# repository/permanent_sites.py
async def update(self, site_id: int, site_data: PermanentSiteUpdate):
    site = await self.get_by_id(site_id)
    if not site:
        return None
    
    # Update only provided fields
    update_data = site_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(site, key, value)
    
    site.updated_at = datetime.now(timezone.utc)
    
    await self.session.commit()
    await self.session.refresh(site)
    return site
```

**8. WebSocket Broadcast**
```
All connected users receive:
{
  type: "data_changed",
  data_type: "permanent",
  action: "update",
  data: {id: 5, name: "בית ספר משודרג"}
}
```

**9. Frontend Auto-Refresh**
```javascript
// App.jsx useWebSocket callback
setDataRefreshTrigger(prev => prev + 1);  // Triggers useSites
```

**10. Map Updates!**
```
User sees updated marker in real-time
```

**זמן כולל:** ~300-500ms מלחיצת "שמור" עד עדכון אצל כל המשתמשים!

---

### Use Case 8: יציאה וחזרה לבחירה

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

#### Exit Button Design

**בעליון (Map Controls):**
```css
/* Styles in MapControls.module.css */
.exitBtn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%) !important;
  color: white !important;
  box-shadow: 0 6px 18px rgba(244, 67, 54, 0.3) !important;
}

.exitBtn::after {
  content: 'יציאה';
  /* Tooltip appears on hover */
  position: absolute;
  left: 100%;
  opacity: 0;
}

.exitBtn:hover::after {
  opacity: 1;
}
```

**ב-Sidebar:**
```jsx
<button className={styles.exitBtn}>
  <span className={styles.exitIcon}>⎋</span>
  <div className={styles.exitText}>
    <div className={styles.exitTitle}>יציאה</div>
    <div className={styles.exitSub}>שינוי משתמש (אורח/מנהל)</div>
  </div>
</button>
```

#### למה `location.reload()` ולא state?

```javascript
// Could do:
setAdmin(null);
setHasEnteredAsGuest(false);
// But complex state management...

// Better:
sessionStorage.clear();
location.reload();
// Clean slate!
```

פשוט יותר ומבטיח שאין state orphans.

---

## Security Layer

### אימות ברמות

```
┌─────────────────────────────────────┐
│  Public Endpoints (כולם)            │
│  • GET /api/permanent-sites         │
│  • GET /api/temporary-sites         │
│  • POST /api/requests               │
│  • WebSocket /ws                    │
└─────────────────────────────────────┘
          ↓ No auth required
          
┌─────────────────────────────────────┐
│  Admin Endpoints (JWT Required)     │
│  • POST/PUT/DELETE sites            │
│  • GET/PUT/POST/DELETE requests     │
│  • GET /api/requests/pending        │
└─────────────────────────────────────┘
          ↓ JWT in Authorization header
```

### JWT Structure

```json
{
  "sub": "1",              // admin_id
  "username": "admin",
  "exp": 1735825200,       // expiry timestamp (24h from issue)
  "iat": 1735738800,       // issued at timestamp
  "type": "access"
}
```

**Signing:**
```python
jwt.encode(payload, SECRET_KEY, algorithm="HS256")
```

**Verification:**
```python
payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
# Automatically checks expiry!
```

### Password Security

**Never store plain text!**

```python
# WRONG ❌
admin.password = "mypassword123"

# CORRECT ✓
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"])

admin.password_hash = pwd_context.hash("mypassword123")
# Stores: "$2b$12$KIXvZ9..."
```

**Verification:**
```python
pwd_context.verify("user_input", stored_hash)
# → True/False
```

**bcrypt properties:**
- Slow on purpose (prevents brute force)
- Unique salt per password
- Industry standard

### Dependency Injection Pattern

```python
# Before (not secure):
@router.post("/api/permanent-sites")
async def create_site(site_data):
    # Anyone can call this!
    ...

# After (secure):
@router.post("/api/permanent-sites")
async def create_site(
    site_data: PermanentSiteCreate,
    admin: Admin = Depends(get_current_admin)  # 👈 FastAPI magic
):
    # Only runs if JWT is valid!
    ...
```

**How it works:**
1. FastAPI calls `get_current_admin()` first
2. If it raises HTTPException(401) → endpoint never runs
3. If it returns Admin → endpoint runs with that admin

### CORS Configuration

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production:** Change to specific domain!

---

## Repository Pattern

### למה?

```
Without Repository:
┌──────────────┐
│ API Endpoint │ ← Tight coupling to SQLAlchemy
│   if/else    │
│   SQL code   │
└──────────────┘

With Repository:
┌──────────────┐
│ API Endpoint │ ← Business logic only
└──────────────┘
       ↓
┌──────────────┐
│ Repository   │ ← Database logic
└──────────────┘
```

**יתרונות:**
1. **Separation of Concerns** - API לא מכיר SQL
2. **Testability** - קל למוק repository
3. **Reusability** - אותה לוגיקה משרתת API + Background jobs
4. **Maintainability** - שינוי DB? רק Repository משתנה
5. **Business Logic** - אחד ממקום (approve() לדוגמה)

### מבנה

```python
# api/permanent_sites.py
@router.get("")
async def get_sites(db: AsyncSession = Depends(get_db)):
    repo = PermanentSitesRepository(db)  # 👈 Create repository
    sites = await repo.get_all()         # 👈 Use simple method
    return sites

# repository/permanent_sites.py
class PermanentSitesRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_all(self) -> List[PermanentSite]:
        result = await self.session.execute(
            select(PermanentSite).order_by(PermanentSite.name)
        )
        return list(result.scalars().all())
    
    async def get_by_id(self, site_id: int) -> Optional[PermanentSite]:
        result = await self.session.execute(
            select(PermanentSite).where(PermanentSite.id == site_id)
        )
        return result.scalar_one_or_none()
    
    async def create(self, site_data: PermanentSiteCreate) -> PermanentSite:
        site = PermanentSite(**site_data.model_dump())
        self.session.add(site)
        await self.session.commit()
        await self.session.refresh(site)
        return site
```

### Schemas vs Models

**Pydantic Schema (Request/Response):**
```python
# schemas/permanent_site.py
class PermanentSiteCreate(BaseModel):
    name: str = Field(..., min_length=1)
    category: Optional[str] = None
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
```

**SQLAlchemy Model (Database):**
```python
# models/permanent_site.py
class PermanentSite(Base):
    __tablename__ = "permanent_sites"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
```

**למה שניהם?**
- Schema = Validation (API layer)
- Model = Database structure (Data layer)
- הפרדה ברורה של concerns

---

## Frontend Architecture

### Component Hierarchy

```
App (AuthProvider wrapped)
 │
 ├─ LoginPage (if not logged in)
 │   └─ LoginPageWrapper
 │
 └─ AppContent (if logged in: guest or admin)
     │
     ├─ SideBar
     │   ├─ Categories filters
     │   └─ Exit button
     │
     ├─ SearchBar
     │   └─ Results dropdown
     │
     ├─ MapView
     │   ├─ Permanent Markers
     │   ├─ Temporary Markers
     │   ├─ User Location Marker
     │   └─ MapLongPressHandler
     │
     ├─ Chat
     │
     ├─ TemporaryEventsPanel
     │   └─ Events list
     │
     ├─ AdminPanel (only if isAdmin)
     │   ├─ Header (logout, admin name)
     │   ├─ Tabs
     │   │   ├─ RequestsTab
     │   │   │   ├─ Request cards
     │   │   │   └─ RequestReviewModal
     │   │   │       ├─ Review form
     │   │   │       └─ Approve/Reject buttons
     │   │   │
     │   │   ├─ PermanentSitesTab
     │   │   │   ├─ Sites table
     │   │   │   ├─ Search
     │   │   │   └─ SiteEditModal
     │   │   │
     │   │   └─ TemporarySitesTab
     │   │       ├─ Events table
     │   │       ├─ Search
     │   │       └─ SiteEditModal
     │   │
     │   └─ Badge (pending count)
     │
     ├─ RequestForm (on long press)
     │   ├─ Request type selector
     │   ├─ Form fields
     │   └─ Submit button
     │
     ├─ NotificationToast[] (multiple)
     │
     └─ Controls (right side buttons)
         ├─ Home 🏠
         ├─ Location 🎯
         ├─ Temp Events ⚡ (with badge)
         ├─ Admin Panel 🔧 (if admin, with badge)
         ├─ Menu ☰
         └─ Exit ⎋
```

### State Management

**Global State (Context):**
```javascript
// AuthContext.jsx
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  
  const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    setToken(data.access_token);
    setAdmin(data.admin);
    sessionStorage.setItem('token', data.access_token);
  };
  
  const logout = () => {
    setToken(null);
    setAdmin(null);
    sessionStorage.clear();
    window.location.reload();
  };
  
  return (
    <AuthContext.Provider value={{ admin, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Any component can use:
const { admin, login, logout } = useAuth();
```

**Local State (Component):**
```javascript
// App.jsx
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [notifications, setNotifications] = useState([]);
const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
```

**Server State (Custom Hooks):**
```javascript
// hooks/useSites.js
export function useSites(shouldRefresh) {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchPermanentSites().then(setPoints);
  }, [shouldRefresh]);  // Re-runs when trigger changes!
  
  return { points, isLoading };
}
```

### Custom Hooks למה?

**Without hooks (bad):**
```javascript
// Every component duplicates this:
useEffect(() => {
  fetch('/api/sites')
    .then(res => res.json())
    .then(data => setPoints(data));
}, []);
```

**With hooks (good):**
```javascript
// Once:
function useSites(refresh) {
  const [points, setPoints] = useState([]);
  useEffect(() => {
    fetchPermanentSites().then(setPoints);
  }, [refresh]);
  return { points };
}

// Everywhere:
const { points } = useSites(trigger);  // Clean!
```

**יתרונות:**
- DRY (Don't Repeat Yourself)
- Easy to test
- Composable
- Reusable logic

### CSS Modules למה?

**Without modules (bad):**
```css
/* global.css */
.button {
  color: red;
}
```
```javascript
<button className="button">Click</button>
// 😱 Conflicts with other .button classes!
```

**With modules (good):**
```css
/* Button.module.css */
.button {
  color: red;
}
```
```javascript
import styles from './Button.module.css';
<button className={styles.button}>Click</button>
// Becomes: <button className="Button_button_3x7k2">
// 😊 Unique, no conflicts!
```

---

## Data Flow Example - מקצה לקצה

**תרחיש מלא:** אדמין יוצר אירוע זמני חדש

### 1. User Action
```
Admin Panel → TemporarySitesTab
  → לוחץ "הוסף אירוע" 
    → SiteEditModal opens
```

### 2. Form Submission
```javascript
// SiteEditModal.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const payload = {
    name: "חסימת כביש בדקל",
    description: "עבודות תשתית",
    category: "roadwork",
    lat: 31.2632,
    lng: 34.8419,
    start_date: "2026-01-02T08:00:00Z",
    end_date: "2026-01-05T18:00:00Z",
    priority: "high",
    status: "active"
  };
  
  await createTemporarySiteAuth(payload, authHeader);
};
```

### 3. API Call
```javascript
// dataService.js
export async function createTemporarySiteAuth(siteData, authHeader) {
  const response = await fetch('http://localhost:8001/api/temporary-sites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    body: JSON.stringify(siteData)
  });
  
  return response.json();
}
```

### 4. Backend Receives Request
```python
# api/temporary_sites.py
@router.post("", response_model=TemporarySiteResponse)
async def create_temporary_site(
    site_data: TemporarySiteCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)  # ← JWT verified here!
):
    # 1. Create via repository
    repo = TemporarySitesRepository(db)
    site = await repo.create(site_data)
    
    # 2. Broadcast to WebSocket
    await notify_data_changed("temporary", "create", {
        "id": site.id,
        "name": site.name
    })
    
    # 3. Return to client
    return site
```

### 5. Database Insert
```python
# repository/temporary_sites.py
async def create(self, site_data: TemporarySiteCreate):
    site = TemporarySite(**site_data.model_dump())
    self.session.add(site)
    await self.session.commit()
    await self.session.refresh(site)
    return site
```

**SQL executed:**
```sql
INSERT INTO temporary_sites (
    name, description, category, lat, lng,
    start_date, end_date, priority, status, created_at
) VALUES (
    'חסימת כביש בדקל', 
    'עבודות תשתית',
    'roadwork',
    31.2632,
    34.8419,
    '2026-01-02 08:00:00+00',
    '2026-01-05 18:00:00+00',
    'HIGH',
    'ACTIVE',
    NOW()
) RETURNING *;
```

### 6. WebSocket Broadcast
```python
# api/websocket.py
await manager.broadcast({
    "type": "data_changed",
    "data_type": "temporary",
    "action": "create",
    "data": {
        "id": 5,
        "name": "חסימת כביש בדקל"
    }
})
```

**Message sent to all 3 connected clients:**
- User 1 (Admin on desktop)
- User 2 (Guest on mobile)
- User 3 (Guest on tablet)

### 7. Frontend Receives WebSocket
```javascript
// App.jsx - useWebSocket callback
useWebSocket((message) => {
  console.log("Received:", message);
  // {type: "data_changed", data_type: "temporary", action: "create"}
  
  // Trigger refresh
  setDataRefreshTrigger(prev => prev + 1);
  
  // Show notification
  addNotification("אירוע זמני נוסף: חסימת כביש בדקל", "update");
});
```

### 8. Data Refresh
```javascript
// hooks/useTemporarySites.js
useEffect(() => {
  const loadSites = async () => {
    const sites = await fetchTemporarySites();
    setTemporarySites(sites);
  };
  loadSites();
}, [shouldRefresh]);  // ← This changed! Re-runs!
```

### 9. Map Updates
```javascript
// MapView.jsx
{temporarySites.map((t) => (
  <Marker
    key={`temporary-${t.id}`}
    position={[t.lat, t.lng]}
    icon={getTemporaryIcon(t.priority)}
  >
    <Popup>
      <TemporarySitePopup site={t} />
    </Popup>
  </Marker>
))}
```

**New marker appears on map!** 🎉

### 10. Notification Toast
```javascript
// NotificationToast.jsx
<div className={styles.toast}>
  <div className={styles.message}>
    אירוע זמני נוסף: חסימת כביש בדקל
  </div>
</div>
```

**Toast appears, auto-dismisses after 5 seconds.**

---

## Timing Breakdown

```
User clicks "שמור"
  ↓ ~50ms (client-side validation)
HTTP POST request
  ↓ ~30ms (network)
FastAPI receives
  ↓ ~5ms (JWT verification)
  ↓ ~10ms (repository create)
PostgreSQL INSERT
  ↓ ~15ms (database write)
WebSocket broadcast
  ↓ ~20ms (send to all clients)
Clients receive message
  ↓ ~10ms (React state update)
  ↓ ~50ms (re-fetch data)
  ↓ ~30ms (API response)
  ↓ ~20ms (React re-render)
Map updates with new marker
  ↓ ~50ms (Leaflet rendering)

TOTAL: ~290ms 🚀
```

**מהיר מאוד!** משתמשים לא מרגישים עיכוב.

---

## סיכום ארכיטקטורה

### עקרונות מרכזיים

1. **Separation of Concerns**
   - API ≠ Repository ≠ Database
   - Components ≠ Hooks ≠ Context

2. **Real-time First**
   - WebSocket לכל שינוי
   - עדכון מיידי לכולם

3. **Security by Design**
   - JWT authentication
   - bcrypt hashing
   - Public vs Admin endpoints

4. **Developer Experience**
   - Repository pattern (testable)
   - Custom hooks (reusable)
   - CSS Modules (scoped)
   - TypeScript-like validation (Pydantic)

5. **User Experience**
   - < 300ms updates
   - Toast notifications
   - Optimistic UI where possible
   - Clear feedback

### טכנולוגיות ייחודיות במערכת

1. **APScheduler** - Background jobs בPython
2. **React Leaflet** - Maps interactive
3. **CSS Modules** - Scoped styling
4. **WebSocket Manager** - Custom implementation
5. **Long Press Detection** - Custom hook
6. **JWT + bcrypt** - Industry standard security
7. **Repository Pattern** - Clean architecture
8. **Alembic** - Database migrations

---

**מסמך זה נכתב ב-2 בינואר 2026 ומתעדכן עם המערכת.**

