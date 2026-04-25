# OmerOpsMap Deployment Guide

Deploy OmerOpsMap to DigitalOcean with Nginx Proxy Manager for automatic HTTPS/SSL.

---

## Prerequisites

- DigitalOcean droplet with Docker installed (Ubuntu 22.04+)
- SSH access to the droplet
- This repository cloned on your local machine

---

## One-Command Deployment

From your **local machine**, in the project root directory:

```bash
./deploy.sh 165.245.218.35 "your-admin-password"
```

This script will:
1. SSH into the droplet
2. Clone/pull the latest `deploy` branch
3. Tear down existing containers
4. Create `.env` file with production config
5. Build and start all services

**Output will show:**
- NPM UI URL (for SSL setup)
- Web app URL
- Admin credentials

---

## What the Script Does

### Step 1: Firewall Setup
Opens ports 22, 80, 443

### Step 2: Clone/Update Repository
```bash
git clone --branch deploy https://github.com/BadashIdo/OmerOpsMap.git
# or pulls latest if already cloned
```

### Step 3: Remove Old Containers
```bash
docker compose down -v  # Clean slate
```

### Step 4: Generate SSL Certificate & Environment Configuration

**SSL Certificate:**
- Generates a self-signed certificate automatically
- Valid for 365 days, renewed with each deployment
- Stored in `nginx/certs/`

**Creates `.env` file with:**
- Random `SECRET_KEY` for JWT tokens
- Admin credentials
- Database connection string
- HTTPS API URLs (https://{droplet_ip})
- WebSocket secure URL (wss://{droplet_ip}/ws)

### Step 5: Start Services
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This starts:
- **PostgreSQL** — database (port 5432, internal only)
- **FastAPI Backend** — data_server (port 8001, internal only)
- **React Frontend** — Vite app (internal only)
- **Nginx** — reverse proxy with HTTPS/SSL (ports 80, 443)

---

## After Deployment: Verify HTTPS Works

### 1. SSL Certificate Information

The deployment automatically generates a **self-signed SSL certificate** for testing:
- ✅ Enables HTTPS immediately (no manual setup needed)
- ✅ All HTTP traffic redirects to HTTPS
- ✅ Internal services communicate via HTTP
- ⚠️ Browsers will show a security warning (this is normal for self-signed certs)

### 2. Access Your Application

Open `https://165.245.218.35` in your browser:

1. **You will see a security warning** (self-signed certificate)
   - Chrome: Click "Advanced" → "Proceed to 165.245.218.35"
   - Firefox: Click "Advanced" → "Accept the Risk and Continue"
   - Safari: Click "Show Details" → "visit this website"
   
2. **After accepting, you'll see the OmerOpsMap frontend**

3. **Test the application:**
   - Check browser DevTools → Network tab
   - Verify API calls are going to `https://165.245.218.35/api`
   - Verify WebSocket connects to `wss://165.245.218.35/ws`

### 3. For Production: Upgrade to Real SSL Certificate

To use a real SSL certificate (Let's Encrypt) instead of self-signed:

1. **Point your domain to the droplet** (update DNS A record)
   ```
   your-domain.com → 165.245.218.35
   ```

2. **Update docker-compose.prod.yml** to use certbot:
   - Replace the nginx service with nginx + certbot
   - See [Production SSL Setup](#production-ssl-setup) below

3. **Redeploy:**
   ```bash
   ./deploy.sh 165.245.218.35 "admin-password"
   ```

---

## Production SSL Setup (Let's Encrypt)

When you're ready for production with a real domain, this setup uses certbot to automatically obtain and renew SSL certificates from Let's Encrypt.

---

## Re-Deploy After Code Changes

```bash
# From your local machine
./deploy.sh 165.245.218.35 "admin-password"
```

This will:
- Pull latest code from `deploy` branch
- Rebuild Docker images
- Restart all containers
- Keep your database and SSL certificates intact

---

## Manual Commands on the Droplet

If you need to manage things manually, SSH into the droplet:

```bash
ssh root@165.245.218.35
cd /opt/omeropsmap

# View logs
docker compose logs -f

# Check status
docker ps

# Rebuild a specific service
docker compose build data_server
docker compose up -d data_server

# View database with Adminer (if enabled)
# Note: disabled in production for security

# Stop everything
docker compose down
```

---

## Troubleshooting

### App shows blank page or 404

**Check:** Frontend is built correctly
```bash
docker compose logs frontend
```

Verify `VITE_API_URL` in `.env` uses HTTPS and points to your droplet IP.

### Browser shows SSL certificate warning but won't connect

**This is expected** with self-signed certificates:
1. Click "Advanced" (Chrome) or "Proceed Anyway" (others)
2. Accept the security warning
3. You should now see the app

### API calls fail (CORS errors or 404)

**Check:** Backend and nginx are running
```bash
docker compose logs data_server
docker compose logs nginx
```

Verify:
- `VITE_API_URL` in `.env` uses `https://` (not `http://`)
- `ALLOWED_ORIGINS` in `.env` includes `https://${DROPLET_IP}`

### WebSocket connection fails (wss:// errors)

**Check:** nginx is proxying WebSocket correctly
```bash
docker compose logs nginx
```

Verify the nginx config has WebSocket support (Upgrade/Connection headers).

### Database connection errors

```bash
docker compose logs postgres
```

Verify `DATABASE_URL` in `.env` has correct password.

---

## Security Checklist

- [ ] ✅ HTTPS enabled (self-signed certificate)
- [ ] Change admin password after first login
- [ ] Accept the browser SSL warning (expected for self-signed certs)
- [ ] Update `ALLOWED_ORIGINS` if upgrading to a real domain
- [ ] Backup database regularly (`postgres_data` volume)
- [ ] Monitor `/opt/omeropsmap/.env` — don't commit to git
- [ ] Rotate `SECRET_KEY` if credentials leaked
- [ ] Upgrade to Let's Encrypt when deploying to production with a real domain

---

## File Structure on Droplet

```
/opt/omeropsmap/
├── docker-compose.yml              # Base compose config
├── docker-compose.prod.yml         # Production overrides
├── .env                            # ⚠️ SECRETS (DO NOT COMMIT)
├── .git/                           # Repository metadata
├── front/                          # React frontend
├── data_server/                    # FastAPI backend
├── back/                           # AI agent (optional)
└── nginx/
    ├── data/                       # NPM configuration
    └── letsencrypt/                # SSL certificates
```

---

## Updates and Maintenance

### Update Code
```bash
./deploy.sh 165.245.218.35 "admin-password"
```

### Update Docker Images
```bash
ssh root@165.245.218.35
cd /opt/omeropsmap
docker compose pull
docker compose up -d
```

### Database Backups
PostgreSQL data is stored in the `postgres_data` Docker volume. To backup:

```bash
ssh root@165.245.218.35
docker exec omeropsmap_postgres pg_dump -U omeropsmap omeropsmap > backup.sql
```

---

## Questions?

- Check logs: `docker compose logs service_name`
- View env: `cat .env`
- SSH into droplet and inspect: `docker ps`, `docker inspect container_name`
