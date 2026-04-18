# OmerOpsMap - Quick Start Guide

> Clone → Setup → Run → Access on Phone (Same WiFi)

This guide will get the OmerOpsMap app running locally with admin access and mobile support.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- Git

---

## Step 1: Clone & Navigate

```bash
git clone https://github.com/BadashIdo/OmerOpsMap.git
cd OmerOpsMap
```

---

## Step 2: Create Environment File

Create a `.env` file in the project root:

```bash
cat > .env << 'EOF'
# Admin credentials (auto-created on first startup)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=123123
INITIAL_ADMIN_DISPLAY_NAME=מנהל

# JWT Secret (change in production)
SECRET_KEY=dev-secret-key-change-in-production
EOF
```

> **Note:** Password must be at least 6 characters. Default login: `admin` / `123123`

---

## Step 3: Get Your Local IP (For Mobile Access)

### macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

### Or simply:
```bash
curl -s https://ipv4.icanhazip.com
```

**Example output:** `192.168.10.5`

> This is your IP for accessing the app from your phone on the same WiFi network.

---

## Step 4: Update docker-compose.yml with Your IP

Edit `docker-compose.yml` and update the frontend environment variables:

```yaml
frontend:
  environment:
    - VITE_API_URL=http://YOUR_IP_HERE:8001
    - VITE_WS_URL=ws://YOUR_IP_HERE:8001/ws
```

**Replace `YOUR_IP_HERE` with your actual IP** (e.g., `192.168.10.5`).

---

## Step 5: Start the App

```bash
# Build and start all services
docker-compose up -d

# Wait for startup (first time may take 2-3 minutes)
sleep 30

# Check if all services are running
docker-compose ps
```

**Expected output:**
```
NAME                    STATUS          PORTS
omeropsmap_frontend     Up              0.0.0.0:5173->5173/tcp
omeropsmap_data_server  Up              0.0.0.0:8001->8001/tcp
omeropsmap_postgres     Up (healthy)    0.0.0.0:5432->5432/tcp
```

---

## Step 6: Access the App

### Desktop Browser:
```
http://localhost:5173
```

### Phone (Same WiFi):
```
http://YOUR_IP:5173
```
**Example:** `http://192.168.10.5:5173`

> Make sure your phone is connected to the **same WiFi network** as your computer.

---

## Step 7: Login as Admin

1. Open the app (on desktop or phone)
2. Click **"כניסה כמנהל"** (Enter as admin)
3. Enter credentials:
   - **Username:** `admin`
   - **Password:** `123123`
4. Click **"התחבר"**

**Admin features available:**
- Import data from Excel
- Add/edit/delete sites
- Review pending requests
- Manage temporary events

---

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f data_server
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart everything
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build
```

### Stop Everything
```bash
docker-compose down
```

### Reset Database (Start Fresh)
```bash
docker-compose down -v  # Removes database volume
docker-compose up -d     # Starts fresh with auto-import
```

---

## Troubleshooting

### Can't access from phone?
1. Check phone is on **same WiFi** as computer
2. Verify IP address hasn't changed: `ifconfig` (macOS) or `ipconfig` (Windows)
3. Temporarily disable firewall: `sudo ufw disable` (Linux) or check macOS/Windows settings
4. Try accessing API directly: `http://YOUR_IP:8001/api/permanent-sites`

### Frontend shows "Failed to fetch"?
- Backend might still be starting - wait 30 seconds and refresh
- Check backend logs: `docker-compose logs data_server`
- Verify your IP in `docker-compose.yml` is correct

### Database connection errors?
```bash
# Check postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart all
docker-compose down
docker-compose up -d
```

### Excel data not imported?
- First startup auto-imports from `data_server/data/Omer_GIS_Reorganized_Final.xlsx`
- Check logs: `docker-compose logs data_server | grep -i import`
- Or use Admin Panel → "יבוא נתונים" (Import Data)

---

## Project Structure

```
OmerOpsMap/
├── docker-compose.yml      # Main orchestration file
├── .env                    # Environment variables (you create this)
├── QUICK_START.md          # This file
│
├── data_server/            # FastAPI Backend
│   ├── data/               # Excel data files
│   ├── app/                # API code
│   └── scripts/            # Utility scripts
│
└── front/                  # React Frontend
    ├── src/
    └── public/
```

---

## What's Included?

- **PostgreSQL** database (port 5432)
- **FastAPI** backend (port 8001)
- **React + Vite** frontend (port 5173)
- Auto-import of municipal sites from Excel
- Admin authentication with JWT
- Real-time WebSocket updates
- Mobile-responsive design

---

## Next Steps

- Customize admin password in `.env`
- Import your own data via Admin Panel
- Check API docs: `http://localhost:8001/docs`
- Read full docs in `front/README.md` and `data_server/README.md`

---

**Need help?** Check the logs with `docker-compose logs -f` or ask Claude! 🤖
