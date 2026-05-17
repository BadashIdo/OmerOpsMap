#!/bin/bash

#############################################################################
# OmerOpsMap FRONTEND-ONLY Deployment Script for DigitalOcean
# Updates only the frontend: pulls latest code, rebuilds the frontend image,
# and restarts only the frontend container.
#
# Preserves: postgres volume (DB data), data_server, ai_agent, mcp_nearby_sites,
#            nginx — they keep running untouched.
#
# Usage: ./deploy-frontend.sh [DROPLET_IP] [BRANCH]
#
# Examples:
#   ./deploy-frontend.sh                                # Update frontend on default IP, "deploy" branch
#   ./deploy-frontend.sh 165.245.218.35                 # Update frontend on given IP
#   ./deploy-frontend.sh 165.245.218.35 main            # Update from "main" branch
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
DROPLET_IP="${1:-165.245.218.35}"
BRANCH="${2:-deploy}"
REPO_URL="https://github.com/Yaminye/OmerOpsMap.git"
APP_DIR="/opt/omeropsmap"

log_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

log_warning() {
  echo -e "${RED}⚠️  WARNING: $1${NC}"
}

log_section "🎨 OmerOpsMap FRONTEND-ONLY Deployment"
echo "Target Droplet:  ${YELLOW}${DROPLET_IP}${NC}"
echo "Repository:      ${YELLOW}${REPO_URL}${NC}"
echo "Branch:          ${YELLOW}${BRANCH}${NC}"
echo "App Directory:   ${YELLOW}${APP_DIR}${NC}"

echo -e "\n${CYAN}This process will:${NC}"
echo "  1. Pull latest code from GitHub (git fetch + reset to origin/${BRANCH})"
echo "  2. Refresh .env from local file + prod overrides"
echo "  3. Rebuild ONLY the frontend image (no-cache)"
echo "  4. Restart ONLY the frontend container"
echo ""
echo -e "${GREEN}Preserved (NOT touched):${NC} postgres + DB volume, data_server, ai_agent, mcp_nearby_sites, nginx"

#############################################################################
# Upload local .env to droplet
#############################################################################
LOCAL_ENV="$(dirname "$0")/.env"
if [ ! -f "${LOCAL_ENV}" ]; then
  log_warning "Local .env not found at ${LOCAL_ENV} — aborting."
  echo "Create one (copy from .env.example) before running this script."
  exit 1
fi

log_section "📤 Uploading local .env to droplet..."
ssh -o StrictHostKeyChecking=accept-new root@${DROPLET_IP} "mkdir -p /tmp"
scp -o StrictHostKeyChecking=accept-new "${LOCAL_ENV}" root@${DROPLET_IP}:/tmp/omeropsmap.env
echo "✅ .env uploaded to /tmp/omeropsmap.env"

#############################################################################
# Deploy to Droplet via SSH
#############################################################################
log_section "📦 Connecting to droplet and updating frontend..."

ssh -o StrictHostKeyChecking=accept-new root@${DROPLET_IP} << DEPLOY_SCRIPT

set -e

log_info() {
  echo -e "\${1}"
}

# Fail fast if the app directory doesn't exist — this script assumes a previous
# full deployment has already been run via deploy-fresh.sh.
if [ ! -d "${APP_DIR}" ]; then
  echo "❌ ${APP_DIR} does not exist. Run deploy-fresh.sh first for an initial deployment."
  exit 1
fi

cd ${APP_DIR}

log_info "\n${BLUE}[1/5]${NC} Fetching latest code from ${BRANCH}..."
git fetch origin ${BRANCH} > /dev/null 2>&1
git reset --hard origin/${BRANCH} > /dev/null 2>&1
echo "✅ Code updated to latest origin/${BRANCH}"

# Preserve existing SECRET_KEY from the running deployment (don't rotate JWT signing key,
# otherwise all logged-in users would be kicked out and existing sessions invalidated).
EXISTING_SECRET_KEY=\$(grep '^SECRET_KEY=' .env 2>/dev/null | tail -1 | cut -d'=' -f2- || echo "")
if [ -z "\${EXISTING_SECRET_KEY}" ]; then
  EXISTING_SECRET_KEY=\$(openssl rand -hex 32)
  echo "⚠️  No existing SECRET_KEY found — generated a new one"
fi

# Preserve existing admin password (don't reset it on every frontend deploy)
EXISTING_ADMIN_PASSWORD=\$(grep '^INITIAL_ADMIN_PASSWORD=' .env 2>/dev/null | tail -1 | cut -d'=' -f2- || echo "admin123")

log_info "\n${BLUE}[2/5]${NC} Refreshing .env from uploaded local + prod overrides..."
if [ ! -f /tmp/omeropsmap.env ]; then
  echo "❌ /tmp/omeropsmap.env missing — scp must have failed"
  exit 1
fi
cp /tmp/omeropsmap.env .env

cat >> .env << ENVFILE

# ── Production overrides (appended by deploy-frontend.sh on \$(date)) ────────
SECRET_KEY=\${EXISTING_SECRET_KEY}
ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
INITIAL_ADMIN_PASSWORD=\${EXISTING_ADMIN_PASSWORD}
POSTGRES_PASSWORD=omeropsmap_prod_pass
DATABASE_URL=postgresql+asyncpg://omeropsmap:omeropsmap_prod_pass@postgres:5432/omeropsmap
VITE_API_URL=https://${DROPLET_IP}
VITE_WS_URL=wss://${DROPLET_IP}/ws
VITE_AI_AGENT_URL=https://${DROPLET_IP}/ai
ALLOWED_ORIGINS=https://${DROPLET_IP},http://frontend,http://nginx
ENVFILE

rm -f /tmp/omeropsmap.env
echo "✅ .env refreshed (SECRET_KEY + admin password preserved)"

# Show current commit info so we know what was deployed
COMMIT_HASH=\$(git rev-parse --short HEAD)
COMMIT_FULL_HASH=\$(git rev-parse HEAD)
COMMIT_MESSAGE=\$(git log -1 --pretty=%B)
COMMIT_DATE=\$(git log -1 --format=%ai)
COMMIT_AUTHOR=\$(git log -1 --format=%an)
CURRENT_BRANCH=\$(git rev-parse --abbrev-ref HEAD)

log_info "\n${CYAN}════════════════════════════════════════${NC}"
log_info "${YELLOW}📍 DEPLOYING FRONTEND FROM:${NC}"
log_info "${CYAN}════════════════════════════════════════${NC}"
log_info "  • Branch:          ${GREEN}\${CURRENT_BRANCH}${NC}"
log_info "  • Commit (short):  ${GREEN}\${COMMIT_HASH}${NC}"
log_info "  • Commit (full):   ${GREEN}\${COMMIT_FULL_HASH}${NC}"
log_info "  • Author:          ${GREEN}\${COMMIT_AUTHOR}${NC}"
log_info "  • Date:            ${GREEN}\${COMMIT_DATE}${NC}"
log_info "  • Message:         ${GREEN}\${COMMIT_MESSAGE}${NC}"
log_info "${CYAN}════════════════════════════════════════${NC}"

log_info "\n${BLUE}[3/5]${NC} Rebuilding frontend image (no-cache to pick up code changes)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache frontend
echo "✅ Frontend image rebuilt"

log_info "\n${BLUE}[4/5]${NC} Recreating frontend container only (other services untouched)..."
# --no-deps prevents docker compose from also restarting postgres/data_server/etc.
# --force-recreate ensures the new image is actually used even if config hash matches.
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend
echo "✅ Frontend container recreated"

log_info "\n${BLUE}[5/5]${NC} Verifying running services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo ""

log_info "\n${GREEN}✨ FRONTEND DEPLOYMENT COMPLETE!${NC}"

log_info "\n${YELLOW}📊 Access Your Application:${NC}"
echo "  • Web App (HTTPS): https://${DROPLET_IP}"

log_info "\n${YELLOW}📋 Monitor:${NC}"
echo "  • Frontend logs:    docker compose logs -f frontend"
echo "  • All services:     docker ps"

DEPLOY_SCRIPT

log_section "✅ Frontend deployment finished successfully!"
echo -e "Your application is ready! Access it at: ${YELLOW}https://${DROPLET_IP}${NC}"
echo ""
