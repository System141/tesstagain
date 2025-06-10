#!/bin/bash

# Quick deployment fix for TypeScript errors and NFT.Storage

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get NFT.Storage key
NFT_STORAGE_KEY="${1:-$NEXT_PUBLIC_NFT_STORAGE_KEY}"

if [ -z "$NFT_STORAGE_KEY" ]; then
    print_error "NFT.Storage API key required!"
    echo "Usage: $0 <nft-storage-api-key>"
    echo "Or: NEXT_PUBLIC_NFT_STORAGE_KEY=your_key $0"
    exit 1
fi

export NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

print_status "Deploying fixes to VPS..."

# Pull latest changes
print_status "Pulling latest code..."
git pull origin vpstest

# Stop containers
print_status "Stopping containers..."
docker compose down

# Clean build cache
print_status "Cleaning build cache..."
docker builder prune -f

# Build with fix
print_status "Building with TypeScript fix and NFT.Storage..."
docker compose build --no-cache \
  --build-arg NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

# Start services
print_status "Starting services..."
docker compose up -d

# Wait and verify
print_status "Waiting for startup..."
sleep 25

if docker compose ps | grep -q "Up"; then
    print_success "Deployment successful!"
    docker compose ps
    print_status "Access at: http://$(hostname -I | awk '{print $1}'):3000"
else
    print_error "Deployment failed!"
    docker compose logs
fi