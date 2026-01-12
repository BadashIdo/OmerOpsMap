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

## Quick Start

### 1. Start services
```bash
docker-compose up -d
```

### 2. Run migrations
```bash
docker-compose exec data_server alembic upgrade head
```

### 3. Migrate Excel data
```bash
docker-compose exec data_server python scripts/migrate_excel.py
```

API will be available at http://localhost:8001

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

## Background Services

### Expiry Scheduler
Runs every minute to:
1. Find expired temporary events
2. Move them to temporary_history
3. Broadcast expiry notification via WebSocket

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

1. Copy production environment file:
```bash
cp .env.prod.example .env.prod
# Edit and set strong passwords
```

2. Deploy with production compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Run migrations:
```bash
docker-compose -f docker-compose.prod.yml exec data_server alembic upgrade head
```

## Security Notes

- Change `ADMIN_PASSWORD` in production
- Use strong database passwords
- Configure CORS for specific origins
- Use HTTPS in production
- Rotate admin keys regularly

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
