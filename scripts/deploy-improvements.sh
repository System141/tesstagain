#!/bin/bash

# Jugiter NFT Launchpad - Deploy Magic Eden Improvements
# This script deploys the enhanced version with Magic Eden-inspired features

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

# Configuration
PROJECT_NAME="jugiter"
PINATA_API_KEY="${PINATA_API_KEY:-$1}"
PINATA_SECRET_KEY="${PINATA_SECRET_KEY:-$2}"

print_header "Jugiter NFT Launchpad - Magic Eden Improvements Deployment"

# Validate inputs
if [ -z "$PINATA_API_KEY" ] || [ -z "$PINATA_SECRET_KEY" ]; then
    print_error "Usage: $0 <PINATA_API_KEY> <PINATA_SECRET_KEY>"
    print_status "Example: $0 your_pinata_api_key your_pinata_secret_key"
    exit 1
fi

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

# Create environment file with Pinata configuration
print_status "Setting up environment with Pinata configuration..."
cat > frontend/.env.local << EOF
# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=${PINATA_API_KEY}
NEXT_PUBLIC_PINATA_SECRET_KEY=${PINATA_SECRET_KEY}

# NFT.Storage is deprecated - uploads decommissioned June 30, 2024
# NEXT_PUBLIC_NFT_STORAGE_KEY=no_longer_functional
EOF

print_success "Environment configured for Pinata"

# Stop existing containers
print_status "Stopping existing containers..."
docker compose down || true

# Remove old images to ensure fresh build
print_status "Removing old images..."
docker image rm jugiter-frontend:latest 2>/dev/null || true
docker image rm tesstagain-jugiter-frontend:latest 2>/dev/null || true

# Build with no cache to include all improvements
print_status "Building application with Magic Eden improvements..."
docker compose build --no-cache --build-arg NEXT_PUBLIC_PINATA_API_KEY="${PINATA_API_KEY}" --build-arg NEXT_PUBLIC_PINATA_SECRET_KEY="${PINATA_SECRET_KEY}"

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
sleep 30

# Health check
print_status "Performing health checks..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        print_success "Frontend is healthy on port 3000"
        break
    elif curl -f http://localhost:8080/api/health &> /dev/null; then
        print_success "Frontend is healthy on port 8080 (via nginx)"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_status "Health check attempt $RETRY_COUNT/$MAX_RETRIES..."
        sleep 2
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed after $MAX_RETRIES attempts"
    print_status "Checking container status..."
    docker compose ps
    print_status "Checking logs..."
    docker compose logs --tail=50
    exit 1
fi

# Verify improvements are deployed
print_status "Verifying Magic Eden improvements..."
if curl -s http://localhost:3000 | grep -q "The Premier NFT Launchpad" &> /dev/null; then
    print_success "✅ Enhanced hero section is live"
elif curl -s http://localhost:8080 | grep -q "The Premier NFT Launchpad" &> /dev/null; then
    print_success "✅ Enhanced hero section is live (via nginx)"
else
    print_warning "⚠️ Could not verify hero section improvements"
fi

# Display container status
print_status "Container status:"
docker compose ps

print_header "Deployment Summary"
print_success "🎉 Jugiter NFT Launchpad with Magic Eden improvements deployed successfully!"

print_status "New Features Deployed:"
print_status "  ✨ Enhanced homepage with professional hero section"
print_status "  🎨 Magic Eden-style collection cards with stats"
print_status "  🔍 Advanced search and filtering system"
print_status "  📊 Live activity feed for real-time updates"
print_status "  📱 Improved mobile responsiveness"
print_status "  🎯 Better user experience and visual design"

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
print_status "  🔧 Update: git pull && ./scripts/deploy-improvements.sh ${PINATA_API_KEY} ${PINATA_SECRET_KEY}"

print_status ""
print_success "🚀 Your enhanced NFT launchpad is now live!"