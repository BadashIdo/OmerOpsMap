# OmerOpsMap Data Server

FastAPI-based backend server with PostgreSQL database for managing municipal sites and temporary events.

## Features

- 🗄️ PostgreSQL database with async SQLAlchemy
- 🚀 FastAPI REST API
- 🔐 Admin authentication
- 🔄 WebSocket real-time updates
- ⏰ Automatic expiry scheduler
- 📊 Excel data migration
- 🐳 Docker containerization
- 🌐 **External integrations** — live data layers from TomTom Traffic,
  Pikud Haoref alerts, and Open-Meteo weather, geofenced to Omer (5 km)
  with TomTom extending to 12 km to cover Beer Sheva access roads.

## Quick Start

### 1. Copy the env template (first time only)
```bash
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY, POSTGRES_PASSWORD,
# INITIAL_ADMIN_PASSWORD, INITIAL_SUBADMIN_PASSWORD.
# Optional: TOMTOM_API_KEY (free at developer.tomtom.com).
```

### 2. Start services
```bash
docker-compose up -d
```
The container runs `alembic upgrade head` automatically on boot, so
migrations apply themselves.

### 3. (Optional) Seed Excel data
On first boot, if the database is empty AND
`data_server/data/Omer_GIS_Reorganized_Final.xlsx` exists, the start
script auto-imports. Otherwise run manually:
```bash
docker-compose exec data_server python scripts/import_excel_to_db.py
```

API: http://localhost:8001
Frontend: http://localhost:5173
Adminer (DB UI): http://localhost:8080
  System: PostgreSQL · Server: postgres · User/DB: omeropsmap
  Password: from your .env (POSTGRES_PASSWORD)

## Project Structure

```
data_server/
├── app/
│   ├── api/              # API endpoints
│   │   ├── permanent_sites.py
│   │   ├── temporary_sites.py
│   │   ├── websocket.py
│   │   └── router.py
│   ├── auth/             # Authentication
│   │   └── admin.py
│   ├── models/           # SQLAlchemy models
│   │   ├── permanent_site.py
│   │   └── temporary_site.py
│   ├── repository/       # Data access layer
│   │   ├── permanent_sites.py
│   │   └── temporary_sites.py
│   ├── schemas/          # Pydantic schemas
│   │   ├── permanent_site.py
│   │   └── temporary_site.py
│   ├── services/         # Background services
│   │   └── expiry_scheduler.py
│   ├── config.py         # Configuration
│   ├── database.py       # Database setup
│   └── main.py           # FastAPI app
├── alembic/              # Database migrations
├── scripts/              # Utility scripts
│   └── migrate_excel.py
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env
```

## API Endpoints

### Public Endpoints

#### GET /api/permanent-sites
Get all permanent sites.

```bash
curl http://localhost:8001/api/permanent-sites
```

#### GET /api/temporary-sites
Get all active temporary events.

```bash
curl http://localhost:8001/api/temporary-sites
```

#### WebSocket /ws
Real-time updates connection.

```javascript
const ws = new WebSocket('ws://localhost:8001/ws');
```

### Authentication

Admin authentication uses JWT tokens. First, create an admin user:

```bash
# Create first admin
docker-compose exec data_server python scripts/create_admin.py \
  --username admin \
  --password "your-secure-password" \
  --display-name "מנהל ראשי"

# List all admins
docker-compose exec data_server python scripts/create_admin.py list
```

Then login to get a token:

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-secure-password"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "admin": {"id": 1, "username": "admin", "display_name": "מנהל ראשי"}
}
```

Use the token in subsequent requests:
```bash
curl http://localhost:8001/api/requests/pending \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Admin Endpoints

Require either:
- `Authorization: Bearer <token>` header (recommended), or
- `X-Admin-Key` header with admin password (legacy support)

#### POST /api/permanent-sites
Create a new permanent site.

```bash
curl -X POST http://localhost:8001/api/permanent-sites \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: admin123" \
  -d '{
    "name": "בית ספר",
    "category": "חינוך",
    "sub_category": "בית ספר יסודי",
    "lat": 31.2632,
    "lng": 34.8419
  }'
```

#### POST /api/temporary-sites
Create a temporary event.

```bash
curl -X POST http://localhost:8001/api/temporary-sites \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: admin123" \
  -d '{
    "name": "חסימת כביש",
    "category": "roadwork",
    "lat": 31.2632,
    "lng": 34.8419,
    "start_date": "2026-01-02T08:00:00Z",
    "end_date": "2026-01-05T18:00:00Z",
    "priority": "high",
    "status": "active"
  }'
```

#### PUT /api/permanent-sites/{id}
Update a permanent site.

#### DELETE /api/permanent-sites/{id}
Delete a permanent site.

#### PUT /api/temporary-sites/{id}
Update a temporary event.

#### DELETE /api/temporary-sites/{id}
Delete a temporary event.

## Database Schema

### permanent_sites
- id, name, category, sub_category, type
- district, street, house_number
- contact_name, phone, description
- lat, lng
- created_at, updated_at

### temporary_sites
- id, name, description, category
- lat, lng
- start_date, end_date
- priority (low/medium/high/critical)
- status (active/paused/resolved)
- contact_name, phone
- created_at, updated_at

### temporary_history
- Same as temporary_sites + archived_at
- Stores expired events

### admins
- id, username, password_hash
- display_name, email, is_active
- created_at, last_login

### site_requests
- id, request_type, is_temporary
- name, description, category
- lat, lng
- start_date, end_date, priority
- submitter_name, submitter_phone, submitter_email
- status (pending/approved/rejected)
- admin_notes, reviewed_by, reviewed_at
- created_at

## External Integrations (Phase 1.0+)

The backend mirrors live data from external sources onto the Omer map.
Each source is a subclass of `IntegrationClient` registered in
`app/services/integrations/registry.py` and run on its own APScheduler
cadence.

### Sources currently shipping

| Source | Cadence | Geofence | Key required? | What it produces |
|---|---|---|---|---|
| `openmeteo_weather` | 15 min | Omer center (point) | No | Current weather as a HUD widget |
| `oref_alert` (Pikud Haoref) | 30 s | Polygon contains "עומר" | No | Red AlertBanner + pulsing map marker on rocket / drone / civil-defense alerts |
| `tomtom_traffic` | 90 s | 12 km from Omer center | **Yes** | Waze-style colored polylines along jammed/closed roads, severity-coloured (amber → orange → red → deep red, dashed for closures) |

### Sync algorithm (per source per run)

1. `client.fetch()` — pull current state from the upstream API
2. Filter to the source's geofence radius
3. Upsert by `(source, external_id)` — existing rows updated, new rows
   inserted
4. `mark_stale` — rows missing from this run get `is_stale = true`
   after the source's TTL grace period (oref: 90 s, others: cadence × 3)
5. `purge_old` — hard-delete stale rows older than `purge_hours`
   (TomTom: 24 h to comply with their ToS)
6. Broadcast a `data_changed` WebSocket event with the diff
   (added / updated / removed counts) — frontend re-fetches only the
   affected source

If `client.fetch()` raises, the run is logged with `ok=false` and rows
are NOT marked stale — that anti-flicker keeps the map stable across
transient API outages.

### API endpoints

```bash
# Public — list features, optionally filtered by source. 15 s server-side cache.
GET /api/external-features?source=tomtom_traffic&include_stale=false

# Admin only — manually trigger a sync now (60 s rate-limit per source).
POST /api/integrations/{source}/sync

# Admin + subadmin — recent run history for ops visibility.
GET /api/integrations/runs?source=tomtom_traffic&limit=50

# Public — list registered source names.
GET /api/integrations/sources
```

### Adding a new source

1. Create `app/services/integrations/<name>_client.py` extending
   `IntegrationClient`. Implement `fetch()`. Set `cadence_seconds`,
   `radius_km` (0 = use global), and `purge_hours`.
2. Register in `app/services/integrations/registry.py` with
   `register_client(MyClient())`.
3. Add the source name to `EXTERNAL_SOURCES` in
   `app/models/external_feature.py` and to the `external_source` enum
   in a new Alembic migration.
4. Add an `EXTERNAL_LAYERS` entry in `front/src/lib/constants.js` so
   the LayersControl modal shows the toggle.
5. Add an icon factory branch in `front/src/lib/leafletIcons.js`.
6. Tests: add `data_server/tests/test_<name>_client.py` with respx
   HTTP mocks.

That's it. The orchestrator, scheduler registration, geofence, stale
handling, WebSocket broadcasts, and frontend rendering all wire up
generically.

### Pre-flight per source (one-time, before shipping)

* `oref_alert` — pull `https://www.oref.org.il/WarningMessages/History/AlertsHistory.json`,
  grep for "עומר" in the `data` polygon list, confirm the exact name
  string Pikud Haoref uses for Omer. The current code expects `"עומר"`
  exactly. If they redraw the polygon, update `OMER_POLYGON_NAMES` in
  `app/services/integrations/oref_client.py`.
* `tomtom_traffic` — confirm the API key is unrestricted (no domain
  whitelist that excludes the prod host).

## Background Services

### Expiry Scheduler
Runs every minute to:
1. Find expired temporary events
2. Move them to temporary_history
3. Broadcast expiry notification via WebSocket

### Integration Sync Jobs
On boot, one APScheduler `IntervalTrigger` job is registered per
enabled integration source. First run fires ~5 s after boot (staggered
7 s per source to avoid a sync stampede). Subsequent runs fire every
`cadence_seconds`. `EXTERNAL_SYNC_ENABLED=false` disables all
integration jobs entirely.

## Database Migrations

### Create new migration
```bash
docker-compose exec data_server alembic revision --autogenerate -m "description"
```

### Apply migrations
```bash
docker-compose exec data_server alembic upgrade head
```

### Rollback migration
```bash
docker-compose exec data_server alembic downgrade -1
```

## Development

### Run without Docker
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql+asyncpg://...
export ADMIN_PASSWORD=admin123

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Access database
```bash
docker-compose exec postgres psql -U omeropsmap -d omeropsmap
```

### View logs
```bash
docker-compose logs -f data_server
```

## Testing

### Manual API testing
```bash
# Health check
curl http://localhost:8001/health

# Get sites
curl http://localhost:8001/api/permanent-sites

# WebSocket test
wscat -c ws://localhost:8001/ws
```

## Production Deployment

### 1. Prepare a `.env` on the production host

```bash
cp .env.example .env
nano .env
```

The prod compose file (`docker-compose.prod.yml`) **fails fast** if any
of these are missing — by design, so you cannot accidentally ship with
the dev defaults:

| Variable | How to generate / obtain |
|---|---|
| `SECRET_KEY` | `python -c 'import secrets; print(secrets.token_urlsafe(64))'` |
| `POSTGRES_PASSWORD` | strong random string, store in your secret manager |
| `INITIAL_ADMIN_PASSWORD` | strong random string |
| `INITIAL_SUBADMIN_PASSWORD` | strong random string |
| `VITE_API_URL` | `https://your-domain.example` |
| `VITE_WS_URL` | `wss://your-domain.example/ws` |

Optional but recommended for full functionality:

| Variable | How to obtain |
|---|---|
| `TOMTOM_API_KEY` | https://developer.tomtom.com — free 2,500 req/day, no card |
| `IMS_API_TOKEN` | https://ims.gov.il (Phase 1.1) |
| `FIRMS_API_KEY` | https://firms.modaps.eosdis.nasa.gov/api/area/ (Phase 1.2) |
| `GMAPS_API_KEY` | https://console.cloud.google.com (Phase 1.3) |
| `WAZE_PARTNER_TOKEN` | Waze for Cities CCP partnership (Phase 2.0) |

### 2. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

The `data_server` container runs `alembic upgrade head` automatically,
so schema migrations apply on every deploy.

### 3. Verify

```bash
# Container health (should report 'healthy' after ~30 s)
docker-compose -f docker-compose.prod.yml ps

# Backend logs — look for 'Registered integration job' lines and
# 'sync <source> ok' lines on each cadence.
docker-compose -f docker-compose.prod.yml logs -f data_server

# Sanity check the public endpoint (should return JSON, not 502).
curl https://your-domain.example/api/external-features?source=openmeteo_weather

# Sanity check integration health (admin login required).
curl -H "Authorization: Bearer <admin-token>" \
  https://your-domain.example/api/integrations/runs?limit=20
```

### 4. Production hardening that ships in this branch

* `start.sh` runs uvicorn WITHOUT `--reload` in prod (lower memory,
  no file watcher). Dev compose sets `UVICORN_RELOAD=true` to opt in.
* `data_server` healthcheck — `/health` polled every 30 s; container
  marked unhealthy after 3 failures.
* Public `GET /api/external-features` is fronted by a 15 s in-process
  TTL cache (LRU, 64 entries) → DB cannot be hammered by chatty clients.
* Admin `POST /api/integrations/{source}/sync` is rate-limited to one
  call per source per 60 s → leaked admin token cannot burn paid quota.
* Each integration client `is_disabled()`s itself when its API key is
  missing, so a partial deploy (some keys absent) boots cleanly.

### 5. After deploy: rotate the bootstrap admin password

```bash
docker-compose -f docker-compose.prod.yml exec data_server \
  python scripts/create_admin.py reset-password <username>
```

The `INITIAL_ADMIN_PASSWORD` env var is only used the **first** time
the container boots against an empty `admins` table. After that the
hashed password lives in the DB.

## Security Notes

- `SECRET_KEY`, `POSTGRES_PASSWORD`, and admin passwords are required
  in `.env` on production — the prod compose refuses to start without
  them. Never commit `.env`.
- API keys (`TOMTOM_API_KEY` etc) are also `.env`-only. The repo
  ignores `.env` and `docker-compose.override.yml`. Don't commit them
  even though "free tier" — bots scan GitHub for keys and burn quota.
- HTTPS is mandatory in prod (the included nginx config is only a
  template — terminate TLS at your reverse proxy or load balancer).
- CORS is wildcarded by default for dev. For prod, restrict
  `allowed_origins` in `app/config.py` or via env override.
- Rotate the bootstrap admin password right after the first deploy.

## Troubleshooting

### Database connection fails
Check PostgreSQL is running:
```bash
docker-compose ps
docker-compose logs postgres
```

### Migration errors
Reset database:
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec data_server alembic upgrade head
```

### WebSocket not connecting
- Verify data server is running
- Check firewall settings
- Ensure port 8001 is accessible

## License

Proprietary - OmerOpsMap
