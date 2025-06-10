#!/bin/bash

# Quick Fix Script for Common NFT.Storage VPS Issues

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if NFT.Storage key is provided
if [ -z "$1" ] && [ -z "$NEXT_PUBLIC_NFT_STORAGE_KEY" ]; then
    print_error "NFT.Storage API key required!"
    echo "Usage: $0 <nft-storage-api-key>"
    echo "Or: NEXT_PUBLIC_NFT_STORAGE_KEY=your_key $0"
    exit 1
fi

NFT_STORAGE_KEY="${1:-$NEXT_PUBLIC_NFT_STORAGE_KEY}"
export NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

print_status "Quick fix for NFT.Storage deployment..."

# 1. Stop everything
print_status "Stopping all services..."
docker compose down --remove-orphans || true

# 2. Clean up
print_status "Cleaning Docker resources..."
docker system prune -af || true

# 3. Fix frontend Dockerfile if needed
print_status "Checking frontend Dockerfile..."
if ! grep -q "NEXT_PUBLIC_NFT_STORAGE_KEY" frontend/Dockerfile; then
    print_status "Updating Dockerfile with NFT.Storage config..."
    sed -i 's/NEXT_PUBLIC_PINATA_JWT/NEXT_PUBLIC_NFT_STORAGE_KEY/g' frontend/Dockerfile
fi

# 4. Update docker-compose.yml if needed
print_status "Checking docker-compose.yml..."
if ! grep -q "NEXT_PUBLIC_NFT_STORAGE_KEY" docker-compose.yml; then
    print_status "Updating docker-compose.yml with NFT.Storage config..."
    sed -i 's/NEXT_PUBLIC_PINATA_JWT/NEXT_PUBLIC_NFT_STORAGE_KEY/g' docker-compose.yml
fi

# 5. Create .env if missing
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    echo "NEXT_PUBLIC_NFT_STORAGE_KEY=$NFT_STORAGE_KEY" > .env
fi

# 6. Build and start
print_status "Building with NFT.Storage configuration..."
docker compose build --no-cache --build-arg NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

print_status "Starting services..."
docker compose up -d

# 7. Wait and check
print_status "Waiting for services to start..."
sleep 20

if docker compose ps | grep -q "Up"; then
    print_success "Services are running!"
    docker compose ps
    
    print_status "Testing frontend..."
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        print_success "Frontend is healthy!"
    else
        print_error "Frontend health check failed"
        docker compose logs jugiter-frontend --tail=10
    fi
else
    print_error "Services failed to start"
    docker compose logs --tail=20
fi

print_status "Quick fix completed!"