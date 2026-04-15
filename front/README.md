# OmerOpsMap — Frontend

React + Vite interactive map for managing municipal sites and temporary events in the city of Omer.

---

## Quick Start

```bash
cd front
npm install
npm run dev        # → http://localhost:5173
```

Requires the data server running at `http://localhost:8001` (see `data_server/`).

### Environment

Create `front/.env` (or copy from `front/.env.example`):

```env
VITE_API_URL=http://localhost:8001       # data server
VITE_AI_AGENT_URL=http://localhost:8000  # AI chat agent (optional)
```

### Build for production

```bash
npm run build      # output → front/dist/
```

---

## Project Structure

```
front/src/
│
├── app/
│   ├── App.jsx          Root component — wraps AuthProvider + AppRouter
│   └── AppRouter.jsx    Auth-based routing: login vs map page
│
├── pages/
│   └── MapPage.jsx      Main map screen — orchestrates all hooks and panels
│
├── components/
│   ├── MapView.jsx              Leaflet map + all markers
│   ├── MapControls.jsx          Floating button panel (GPS, admin, sidebar…)
│   ├── SideBar.jsx              Slide-in category/district filter menu
│   ├── SearchBar.jsx            Search input + results dropdown
│   ├── LoginPage.jsx            Entry screen (guest or admin login)
│   ├── AdminPanel.jsx           Admin panel shell with tab navigation
│   ├── RequestForm.jsx          Long-press form for submitting site requests
│   ├── TemporaryEventsPanel.jsx List of active temporary events
│   ├── NotificationToast.jsx    Auto-dismissing toast notifications
│   ├── ChatBot.jsx              AI chat widget
│   ├── SearchableDropdown.jsx   Reusable dropdown with search filter
│   │
│   ├── Site/
│   │   ├── SitePopup.jsx          Leaflet popup for permanent sites
│   │   ├── TemporarySitePopup.jsx Leaflet popup for temporary events
│   │   └── SiteActions.jsx        Waze / Google Maps navigation links
│   │
│   └── admin/
│       ├── RequestsTab.jsx        Review pending site requests
│       ├── PermanentSitesTab.jsx  CRUD for permanent sites
│       ├── TemporarySitesTab.jsx  CRUD for temporary events
│       ├── DataImportTab.jsx      Excel → DB import
│       ├── DataExportTab.jsx      DB → Excel export
│       ├── SiteEditModal.jsx      Add / edit site form
│       └── RequestReviewModal.jsx Review and approve/reject a request
│
├── hooks/
│   ├── useSites.js          Fetch + normalize + district-fix permanent sites
│   ├── useTemporarySites.js Fetch active temporary events
│   ├── useWebSocket.js      WebSocket connection with auto-reconnect
│   ├── useFilters.js        Filter state, filteredPoints, categoriesStructure
│   ├── useSearch.js         Scored full-text search over visible sites
│   ├── useGeoLocation.js    Real-time GPS tracking (watchPosition)
│   └── useNotifications.js  Toast list + admin pending-requests badge
│
├── api/
│   ├── sitesApi.js      Read/write permanent and temporary sites (JWT auth)
│   ├── requestsApi.js   Submit and manage site-change requests
│   └── chatService.js   Send messages to the AI agent
│
├── context/
│   └── AuthContext.jsx  JWT auth state, login/logout, getAuthHeader()
│
├── lib/
│   ├── constants.js     OMER_CENTER, DISTRICTS
│   ├── geo.js           Haversine distance, nearest-district lookup
│   ├── leafletIcons.js  Custom Leaflet DivIcons per category
│   ├── temporaryIcons.js Icons for temporary events by priority
│   ├── categoryIcons.js Material icon names per main category (sidebar)
│   └── text.js          normalize() — lowercase + trim for search
│
└── styles/              CSS Modules, one file per component
```

---

## How the pieces fit together

```
App
└── AuthProvider          (AuthContext — JWT state)
    └── AppRouter         (login vs map based on auth)
        ├── LoginPage     (shown when no session)
        └── MapPage       (main screen)
            ├── useSites / useTemporarySites  ← API fetch
            ├── useWebSocket                  ← real-time push
            ├── useFilters                    ← filter logic
            ├── useSearch                     ← search logic
            ├── useGeoLocation                ← GPS tracking
            ├── useNotifications              ← toasts
            │
            ├── MapView        (Leaflet map + markers)
            ├── MapControls    (floating buttons)
            ├── SideBar        (filter menu)
            ├── SearchBar      (search input)
            ├── AdminPanel     (admin CRUD tabs)
            ├── RequestForm    (guest report form)
            ├── TemporaryEventsPanel
            ├── ChatBot
            └── NotificationToast (×N)
```

### User roles

| Role  | How to enter | Capabilities |
|-------|-------------|--------------|
| Guest | "כניסה כאורח" button | View map, search, submit site requests |
| Admin | Username + password  | All guest features + manage sites, review requests, import/export |

### Data flow

1. On mount, `useSites` and `useTemporarySites` fetch from the REST API.
2. `useWebSocket` connects to `ws://…/ws` and listens for `data_changed` events.
3. On any `data_changed` event, `MapPage` increments `dataRefreshTrigger` which causes the hooks to re-fetch.
4. `useFilters` derives `filteredPoints` and `filteredTemporarySites` from the raw data + active filter state.
5. `MapView` renders markers for the filtered lists.

### Adding a new feature

- **New map marker type** → add icon in `lib/`, add marker rendering in `MapView.jsx`
- **New filter dimension** → extend `useFilters.js`
- **New admin tab** → add component in `components/admin/`, register in `AdminPanel.jsx`'s `TABS` array
- **New API endpoint** → add function to `api/sitesApi.js` or `api/requestsApi.js`

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Key dependencies

| Package | Purpose |
|---------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| react-leaflet | Map rendering |
| Leaflet | Core map library |
