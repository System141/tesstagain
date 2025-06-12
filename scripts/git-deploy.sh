#!/bin/bash

# Git-based deployment script for VPS
# This script pulls the latest changes from git and redeploys the application

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

print_header "Jugiter NFT Launchpad - Git Deployment"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

print_status "Current directory: $(pwd)"
print_status "Current branch: $(git branch --show-current)"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "There are uncommitted changes in the working directory"
    git status --short
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
fi

# Pull latest changes
print_status "Pulling latest changes from git..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
git pull origin $(git branch --show-current)
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    print_status "No new changes to deploy"
    print_status "Current commit: $CURRENT_COMMIT"
else
    print_success "Pulled new changes"
    print_status "Previous commit: $CURRENT_COMMIT"
    print_status "New commit: $NEW_COMMIT"
    print_status "Changes:"
    git log --oneline $CURRENT_COMMIT..$NEW_COMMIT
fi

# Preserve environment configuration
if [ -f "frontend/.env.local" ]; then
    print_status "Backing up environment configuration..."
    cp frontend/.env.local frontend/.env.local.backup
    ENV_BACKUP=true
else
    print_warning "No environment configuration found"
    ENV_BACKUP=false
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker compose down || true

# Remove old images to ensure fresh build
print_status "Removing old images..."
docker image rm jugiter-frontend:latest 2>/dev/null || true
docker image rm tesstagain-jugiter-frontend:latest 2>/dev/null || true

# Restore environment configuration
if [ "$ENV_BACKUP" = true ]; then
    print_status "Restoring environment configuration..."
    mv frontend/.env.local.backup frontend/.env.local
fi

# Build new images
print_status "Building application with latest changes..."
docker compose build --no-cache

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
        print_success "✅ Frontend is healthy on port 3000"
        break
    elif curl -f http://localhost:8080 &> /dev/null; then
        print_success "✅ Frontend is healthy on port 8080 (via nginx)"
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
    print_status "Recent logs:"
    docker compose logs --tail=20
    exit 1
fi

# Display current status
print_status "Container status:"
docker compose ps

print_header "Deployment Complete!"

print_success "🎉 Successfully deployed latest changes!"

print_status ""
print_status "✅ Features in this deployment:"
print_status "  • Image uploader integrated into create screen"
print_status "  • Users can upload images and auto-generate IPFS metadata"
print_status "  • Cleaned marketplace UI (removed mint NFT options)"
print_status "  • Updated main page with real platform stats"
print_status "  • Simplified marketplace interface"

print_status ""
print_status "🌐 Access URLs:"
IP_ADDRESS=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
print_status "  Direct access: http://${IP_ADDRESS}:3000"
print_status "  Nginx proxy:  http://${IP_ADDRESS}:8080"

if command -v curl &> /dev/null; then
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your-server-ip")
    if [ "$PUBLIC_IP" != "your-server-ip" ] && [ "$PUBLIC_IP" != "$IP_ADDRESS" ]; then
        print_status "  Public access: http://${PUBLIC_IP}:3000"
        print_status "  Public proxy:  http://${PUBLIC_IP}:8080"
    fi
fi

print_status ""
print_status "📋 Useful commands:"
print_status "  View logs:    docker compose logs -f"
print_status "  Restart:      docker compose restart"
print_status "  Stop:         docker compose down"
print_status "  Redeploy:     ./scripts/git-deploy.sh"

print_status ""
print_status "📊 Deployment summary:"
print_status "  Branch:       $(git branch --show-current)"
print_status "  Commit:       $NEW_COMMIT"
print_status "  Date:         $(date)"

print_success "🚀 Your NFT launchpad is now live with the latest updates!"