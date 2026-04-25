#!/bin/bash

#############################################################################
# OmerOpsMap Deployment Script for DigitalOcean
# Clone/pull latest "deploy" branch, restart all Docker containers
#
# Usage: ./deploy.sh [DROPLET_IP] [ADMIN_PASSWORD]
# Example: ./deploy.sh 165.245.218.35 "admin123"
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DROPLET_IP="${1:-165.245.218.35}"
ADMIN_PASSWORD="${2:-admin123}"
REPO_URL="https://github.com/BadashIdo/OmerOpsMap.git"
BRANCH="deploy"
APP_DIR="/opt/omeropsmap"

log_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

log_section "🚀 OmerOpsMap Deployment Script"
echo "Target Droplet: ${YELLOW}${DROPLET_IP}${NC}"
echo "Repository:     ${YELLOW}${REPO_URL}${NC}"
echo "Branch:         ${YELLOW}${BRANCH}${NC}"
echo "App Directory:  ${YELLOW}${APP_DIR}${NC}"

#############################################################################
# Deploy to Droplet via SSH
#############################################################################
log_section "📦 Connecting to droplet and deploying..."

ssh -o StrictHostKeyChecking=accept-new root@${DROPLET_IP} << DEPLOY_SCRIPT

set -e

# Generate a random SECRET_KEY for JWT
SECRET_KEY=\$(openssl rand -hex 32)

log_info() {
  echo -e "\${1}"
}

log_info "\n${BLUE}[1/6]${NC} Opening firewall ports..."
ufw allow 22/tcp > /dev/null 2>&1 || true
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
ufw allow 81/tcp > /dev/null 2>&1 || true  # NPM admin UI
ufw reload > /dev/null 2>&1 || true
echo "✅ Ports 22, 80, 443, 81 opened"

log_info "\n${BLUE}[2/6]${NC} Setting up application directory..."
mkdir -p ${APP_DIR}
cd ${APP_DIR}
echo "✅ Directory ready: ${APP_DIR}"

log_info "\n${BLUE}[3/6]${NC} Fetching latest code from ${BRANCH} branch..."
if [ -d .git ]; then
  git fetch origin > /dev/null 2>&1
  git checkout ${BRANCH} > /dev/null 2>&1
  git pull origin ${BRANCH} > /dev/null 2>&1
  echo "✅ Pulled latest ${BRANCH} branch"
else
  git clone --branch ${BRANCH} ${REPO_URL} . > /dev/null 2>&1
  echo "✅ Cloned repository (${BRANCH} branch)"
fi

log_info "\n${BLUE}[4/6]${NC} Stopping and removing old Docker containers..."
docker compose down -v > /dev/null 2>&1 || echo "No existing containers"
docker system prune -f > /dev/null 2>&1 || true
echo "✅ Old containers removed"

log_info "\n${BLUE}[5/6]${NC} Creating .env file and SSL certificate..."

# Create nginx certs directory
mkdir -p nginx/certs

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:2048 -keyout nginx/certs/self-signed.key -out nginx/certs/self-signed.crt -days 365 -nodes \
  -subj "/C=IL/ST=Israel/L=Omer/O=OmerOpsMap/CN=${DROPLET_IP}" > /dev/null 2>&1
echo "✅ Self-signed SSL certificate generated"

cat > .env << ENVFILE
# OmerOpsMap Production Environment
# Generated on \$(date)

# JWT & Security
SECRET_KEY=\${SECRET_KEY}
ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# Admin Account (auto-created on first startup)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=${ADMIN_PASSWORD}
INITIAL_ADMIN_DISPLAY_NAME=מנהל עיריית עומר
INITIAL_ADMIN_EMAIL=admin@omer.com

# Database
DATABASE_URL=postgresql+asyncpg://omeropsmap:omeropsmap_prod_pass@postgres:5432/omeropsmap

# Frontend Configuration (HTTPS with self-signed certificate)
VITE_API_URL=https://${DROPLET_IP}
VITE_WS_URL=wss://${DROPLET_IP}/ws

# CORS Origins (HTTP for internal, HTTPS for external)
ALLOWED_ORIGINS=http://${DROPLET_IP},https://${DROPLET_IP},http://frontend,http://nginx
ENVFILE

echo "✅ .env file created"

log_info "\n${BLUE}[6/6]${NC} Building and starting Docker containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo "✅ Containers started (see logs below for build progress)"

log_info "\n${GREEN}✨ DEPLOYMENT COMPLETE!${NC}"

log_info "\n${YELLOW}📊 Access Your Application:${NC}"
echo "  • Web App (HTTPS):         https://${DROPLET_IP}"
echo "  • API (HTTPS):             https://${DROPLET_IP}/api"
echo "  • WebSocket (WSS):         wss://${DROPLET_IP}/ws"

log_info "\n${YELLOW}🔐 Admin Login:${NC}"
echo "  • Username: ${GREEN}admin${NC}"
echo "  • Password: ${GREEN}${ADMIN_PASSWORD}${NC}"

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

log_section "✅ Deployment finished successfully!"
echo -e "Your application is ready! Access it at: ${YELLOW}https://${DROPLET_IP}${NC}"
echo ""
