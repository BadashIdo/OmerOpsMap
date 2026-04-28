#!/bin/bash

#############################################################################
# OmerOpsMap REFRESH Script - Local Development
# Stops all Docker containers and rebuilds from scratch
#
# Usage: ./refresh_all.sh
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

log_section "🔄 OmerOpsMap Local Refresh Script"

# Step 1: Stop all containers
log_section "Step 1: Stopping all Docker containers..."
docker-compose down -v
echo "✅ All containers stopped and volumes removed"

# Step 2: Remove images
log_section "Step 2: Removing Docker images..."
docker-compose down --rmi all 2>/dev/null || true
docker rmi omeropsmap-frontend omeropsmap-data_server 2>/dev/null || true
echo "✅ Docker images removed"

# Step 3: Build images
log_section "Step 3: Building Docker images..."
docker-compose build
echo "✅ Docker images built successfully"

# Step 4: Start containers
log_section "Step 4: Starting Docker containers..."
docker-compose up -d
echo "✅ Docker containers started"

# Step 5: Wait for services to be ready
log_section "Step 5: Waiting for services to be ready..."
sleep 5

# Display service status
echo -e "${YELLOW}📊 Service Status:${NC}"
docker-compose ps

# Display connection info
log_section "✨ REFRESH COMPLETE!"
echo -e "${YELLOW}🌐 Access Your Application:${NC}"
echo "  • Frontend (Vite):     http://localhost:5173"
echo "  • Backend API:         http://localhost:8001"
echo "  • Database Admin UI:   http://localhost:8080"

echo -e "\n${YELLOW}🔐 Default Credentials:${NC}"
echo "  Admin:"
echo "    • Username: ${GREEN}admin${NC}"
echo "    • Password: ${GREEN}admin123${NC}"
echo ""
echo "  Subadmin:"
echo "    • Username: ${GREEN}power_user${NC}"
echo "    • Password: ${GREEN}power1234${NC}"

echo -e "\n${YELLOW}📋 Monitor Logs:${NC}"
echo "  • All services:   docker-compose logs -f"
echo "  • Specific service: docker-compose logs -f [service-name]"
echo "  • Service names: postgres, data_server, frontend, adminer"

echo ""
