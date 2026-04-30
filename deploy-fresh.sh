#!/bin/bash

#############################################################################
# OmerOpsMap FRESH Deployment Script for DigitalOcean
# Complete clean slate: Delete code, clone fresh, reset hard, remove all Docker
# Rebuild everything from scratch
#
# Usage: ./deploy-fresh.sh [DROPLET_IP] [ADMIN_PASSWORD] [BRANCH]
#
# Examples:
#   ./deploy-fresh.sh                                    # Fresh deploy of "deploy" branch
#   ./deploy-fresh.sh 165.245.218.35                     # Fresh deploy to IP
#   ./deploy-fresh.sh 165.245.218.35 "admin123"          # With password
#   ./deploy-fresh.sh 165.245.218.35 "admin123" main     # Deploy "main" branch
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
ADMIN_PASSWORD="${2:-admin123}"
BRANCH="${3:-deploy}"
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

log_section "🔥 OmerOpsMap FRESH Deployment Script"
echo "Target Droplet:  ${YELLOW}${DROPLET_IP}${NC}"
echo "Repository:      ${YELLOW}${REPO_URL}${NC}"
echo "Branch:          ${YELLOW}${BRANCH}${NC}"
echo "App Directory:   ${YELLOW}${APP_DIR}${NC}"

log_warning "This will DELETE everything and rebuild from scratch!"
echo -e "\n${CYAN}This process will:${NC}"
echo "  1. Delete all existing code"
echo "  2. Clone fresh from GitHub"
echo "  3. Show commit info (hash, author, date, message)"
echo "  4. Delete ALL Docker containers"
echo "  5. Delete ALL Docker images"
echo "  6. Rebuild everything from scratch"

#############################################################################
# Upload local .env to droplet (kept out of git, contains API keys)
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
log_section "📦 Connecting to droplet and executing FRESH deployment..."

ssh -o StrictHostKeyChecking=accept-new root@${DROPLET_IP} << DEPLOY_SCRIPT

set -e

# Generate a random SECRET_KEY for JWT
SECRET_KEY=\$(openssl rand -hex 32)

log_info() {
  echo -e "\${1}"
}

log_info "\n${BLUE}[1/8]${NC} Opening firewall ports..."
ufw allow 22/tcp > /dev/null 2>&1 || true
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
ufw allow 81/tcp > /dev/null 2>&1 || true  # NPM admin UI
ufw reload > /dev/null 2>&1 || true
echo "✅ Ports 22, 80, 443, 81 opened"

log_info "\n${BLUE}[2/8]${NC} Deleting all Docker containers..."
docker ps -aq | xargs -r docker stop > /dev/null 2>&1 || true
docker ps -aq | xargs -r docker rm -f > /dev/null 2>&1 || true
echo "✅ All containers deleted"

log_info "\n${BLUE}[3/8]${NC} Deleting all Docker images..."
docker images -q | xargs -r docker rmi -f > /dev/null 2>&1 || true
echo "✅ All images deleted"

log_info "\n${BLUE}[3.5/8]${NC} Deleting Docker volumes (DB wipe)..."
docker volume rm omeropsmap_postgres_data > /dev/null 2>&1 || true
docker volume prune -f > /dev/null 2>&1 || true
echo "✅ Postgres volume wiped — DB starts fresh"

log_info "\n${BLUE}[4/8]${NC} Deleting existing code directory..."
rm -rf ${APP_DIR}
echo "✅ Directory deleted: ${APP_DIR}"

log_info "\n${BLUE}[5/8]${NC} Creating fresh application directory..."
mkdir -p ${APP_DIR}
cd ${APP_DIR}
echo "✅ Directory created: ${APP_DIR}"

log_info "\n${BLUE}[6/8]${NC} Cloning fresh code from ${BRANCH} branch..."
git clone --branch ${BRANCH} ${REPO_URL} . > /dev/null 2>&1
echo "✅ Cloned repository from ${BRANCH} branch"

log_info "\n${BLUE}[7/8]${NC} Executing git reset --hard and creating .env file..."
git reset --hard > /dev/null 2>&1
echo "✅ Git reset --hard executed"

# Create nginx certs directory
mkdir -p nginx/certs

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:2048 -keyout nginx/certs/self-signed.key -out nginx/certs/self-signed.crt -days 365 -nodes \
  -subj "/C=IL/ST=Israel/L=Omer/O=OmerOpsMap/CN=\${DROPLET_IP}" > /dev/null 2>&1
echo "✅ Self-signed SSL certificate generated"

# Use uploaded local .env as base (preserves API keys like TOMTOM_API_KEY)
if [ ! -f /tmp/omeropsmap.env ]; then
  echo "❌ /tmp/omeropsmap.env missing — scp must have failed"
  exit 1
fi
cp /tmp/omeropsmap.env .env

# Append production overrides — docker compose uses last occurrence per key
cat >> .env << ENVFILE

# ── Production overrides (appended by deploy-fresh.sh on \$(date)) ────────────
SECRET_KEY=\${SECRET_KEY}
ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
INITIAL_ADMIN_PASSWORD=${ADMIN_PASSWORD}
POSTGRES_PASSWORD=omeropsmap_prod_pass
DATABASE_URL=postgresql+asyncpg://omeropsmap:omeropsmap_prod_pass@postgres:5432/omeropsmap
VITE_API_URL=https://${DROPLET_IP}
VITE_WS_URL=wss://${DROPLET_IP}/ws
ALLOWED_ORIGINS=https://${DROPLET_IP},http://frontend,http://nginx
ENVFILE

# Cleanup uploaded copy
rm -f /tmp/omeropsmap.env
echo "✅ .env file created from local + prod overrides"

# Show current commit info 
COMMIT_HASH=\$(git rev-parse --short HEAD)
COMMIT_FULL_HASH=\$(git rev-parse HEAD)
COMMIT_MESSAGE=\$(git log -1 --pretty=%B)
COMMIT_DATE=\$(git log -1 --format=%ai)
COMMIT_AUTHOR=\$(git log -1 --format=%an)
CURRENT_BRANCH=\$(git rev-parse --abbrev-ref HEAD)

log_info "\n${CYAN}════════════════════════════════════════${NC}"
log_info "${YELLOW}📍 DEPLOYING FROM:${NC}"
log_info "${CYAN}════════════════════════════════════════${NC}"
log_info "  • Branch:          ${GREEN}\${CURRENT_BRANCH}${NC}"
log_info "  • Commit (short):  ${GREEN}\${COMMIT_HASH}${NC}"
log_info "  • Commit (full):   ${GREEN}\${COMMIT_FULL_HASH}${NC}"
log_info "  • Author:          ${GREEN}\${COMMIT_AUTHOR}${NC}"
log_info "  • Date:            ${GREEN}\${COMMIT_DATE}${NC}"
log_info "  • Message:         ${GREEN}\${COMMIT_MESSAGE}${NC}"
log_info "${CYAN}════════════════════════════════════════${NC}"

log_info "\n${BLUE}[8/8]${NC} Building and starting Docker containers from scratch..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo "✅ Containers started (see logs below for build progress)"

log_info "\n${GREEN}✨ FRESH DEPLOYMENT COMPLETE!${NC}"

log_info "\n${YELLOW}📊 Access Your Application:${NC}"
echo "  • Web App (HTTPS):         https://${DROPLET_IP}"
echo "  • API (HTTPS):             https://${DROPLET_IP}/api"
echo "  • WebSocket (WSS):         wss://${DROPLET_IP}/ws"

log_info "\n${YELLOW}🔐 Admin Login:${NC}"
echo "  • Username: ${GREEN}admin${NC}"
echo "  • Password: ${GREEN}${ADMIN_PASSWORD}${NC}"

log_info "\n${YELLOW}🔐 Subadmin Login:${NC}"
echo "  • Username: ${GREEN}power_user${NC}"
echo "  • Password: ${GREEN}power1234${NC}"
echo "  • Note: Subadmin cannot delete sites and has no access to system management"

log_info "\n${YELLOW}⚠️  SSL CERTIFICATE INFO:${NC}"
echo "  ⚠️  Using self-signed certificate for testing"
echo "  • Your browser will show a security warning"
echo "  • This is normal for self-signed certs"
echo "  • Click \"Proceed\" or \"Advanced\" to continue"

log_info "\n${YELLOW}📋 NEXT STEPS:${NC}"
echo "  1. Open https://${DROPLET_IP} in your browser"
echo "  2. Accept the SSL certificate warning"
echo "  3. Login with credentials above"
echo "  4. Test the application features"
echo "  5. To upgrade to Let's Encrypt later: update docker-compose.prod.yml"

log_info "\n${YELLOW}📋 Monitor Build Progress:${NC}"
echo "  • Real-time logs:    docker compose logs -f"
echo "  • Specific service:  docker compose logs -f frontend"
echo "  • Check status:      docker ps"
echo "  • Restart services:  docker compose restart"
echo "  • Stop all:          docker compose down"

DEPLOY_SCRIPT

log_section "✅ Fresh deployment finished successfully!"
echo -e "Your application is ready! Access it at: ${YELLOW}https://${DROPLET_IP}${NC}"
echo ""
