#!/bin/bash

# Deploy UI Updates - Remove mint NFT options and update static info
# This script deploys the recent UI changes to the VPS

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "${CYAN}=== $1 ===${NC}"; }
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_header "Jugiter NFT Launchpad - UI Updates Deployment"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the tesstagain project root directory"
    exit 1
fi

print_status "Project directory: $(pwd)"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

print_success "Docker is available"

# Show what changes we're deploying
print_status "Changes being deployed:"
print_status "  ❌ Removed 'Mint NFT' option from marketplace"
print_status "  ❌ Removed 'Browse & Trade' buttons"
print_status "  ✅ Updated main page stats to show real platform info"
print_status "  🎨 Simplified marketplace interface"

# Check if containers are running
CONTAINERS_RUNNING=$(docker compose ps -q | wc -l)
if [ "$CONTAINERS_RUNNING" -eq 0 ]; then
    print_warning "No containers are currently running. This might be a fresh deployment."
fi

# Get current environment file if it exists
if [ -f "frontend/.env.local" ]; then
    print_status "Preserving existing environment configuration..."
    cp frontend/.env.local frontend/.env.local.backup
else
    print_warning "No existing .env.local found. You may need to configure Pinata keys."
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker compose down || true

# Remove old frontend image to ensure fresh build
print_status "Removing old frontend image..."
docker image rm jugiter-frontend:latest 2>/dev/null || true
docker image rm tesstagain-jugiter-frontend:latest 2>/dev/null || true

# Build with the UI updates
print_status "Building application with UI updates..."
if [ -f "frontend/.env.local.backup" ]; then
    # Use existing config
    mv frontend/.env.local.backup frontend/.env.local
    docker compose build --no-cache jugiter-frontend
else
    # Build without specific env (user will need to configure)
    docker compose build --no-cache jugiter-frontend
fi

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Build completed successfully"

# Start services
print_status "Starting services..."
docker compose up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 20

# Health check
print_status "Performing health checks..."
MAX_RETRIES=20
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend is healthy on port 3000"
        break
    elif curl -f http://localhost:8080 &> /dev/null; then
        print_success "Frontend is healthy on port 8080 (via nginx)"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_status "Health check attempt $RETRY_COUNT/$MAX_RETRIES..."
        sleep 3
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed after $MAX_RETRIES attempts"
    print_status "Checking container status..."
    docker compose ps
    print_status "Checking logs..."
    docker compose logs --tail=30
    exit 1
fi

# Verify UI changes are deployed
print_status "Verifying UI updates..."
if curl -s http://localhost:3000 | grep -q "Sepolia" &> /dev/null; then
    print_success "✅ Updated platform stats are live"
elif curl -s http://localhost:8080 | grep -q "Sepolia" &> /dev/null; then
    print_success "✅ Updated platform stats are live (via nginx)"
else
    print_warning "⚠️ Could not verify platform stats update"
fi

# Display container status
print_status "Container status:"
docker compose ps

print_header "Deployment Summary"
print_success "🎉 UI updates deployed successfully!"

print_status ""
print_status "✅ Changes Applied:"
print_status "  • Removed mint NFT functionality from marketplace"
print_status "  • Simplified marketplace to focus on viewing collections"
print_status "  • Updated main page to show real platform information"
print_status "  • Changed stats from fake numbers to: Sepolia, ERC-721, IPFS, Testnet"

print_status ""
print_status "Access URLs:"
IP_ADDRESS=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
print_status "  🌐 http://${IP_ADDRESS}:3000 (Direct)"
print_status "  🌐 http://${IP_ADDRESS}:8080 (Nginx Proxy)"

if command -v curl &> /dev/null; then
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your-server-ip")
    if [ "$PUBLIC_IP" != "your-server-ip" ]; then
        print_status "  🌍 http://${PUBLIC_IP}:3000 (Public)"
        print_status "  🌍 http://${PUBLIC_IP}:8080 (Public via Nginx)"
    fi
fi

print_status ""
print_status "Useful Commands:"
print_status "  📋 View logs: docker compose logs -f"
print_status "  🔄 Restart: docker compose restart"
print_status "  🛑 Stop: docker compose down"
print_status "  🔧 Re-deploy: ./scripts/deploy-ui-updates.sh"

if [ ! -f "frontend/.env.local" ]; then
    print_warning ""
    print_warning "⚠️  Environment Configuration Needed:"
    print_warning "    Create frontend/.env.local with your Pinata API keys:"
    print_warning "    NEXT_PUBLIC_PINATA_API_KEY=your_api_key"
    print_warning "    NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key"
fi

print_status ""
print_success "🚀 Your cleaned-up NFT launchpad interface is now live!"