#!/bin/bash

# Update NFT.Storage Configuration Script
# This script helps update the NFT.Storage API key and redeploy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if NFT.Storage API key is provided
if [ -z "$1" ]; then
    print_error "Please provide your NFT.Storage API key as argument"
    echo "Usage: $0 <nft-storage-api-key>"
    echo "Get your free API key from: https://nft.storage"
    exit 1
fi

NFT_STORAGE_KEY="$1"

print_status "Updating NFT.Storage configuration..."

# Update .env.production file
if [ -f ".env.production" ]; then
    sed -i "s/your_nft_storage_api_key_here/$NFT_STORAGE_KEY/g" .env.production
    print_success "Updated .env.production"
else
    print_warning ".env.production not found, creating it..."
    cat > .env.production << EOF
# Production Environment Configuration for VPS Deployment

# Docker Compose Configuration
COMPOSE_PROJECT_NAME=jugiter
COMPOSE_FILE=docker-compose.yml

# Application Configuration
NODE_ENV=production
PORT=3000

# Frontend Environment Variables
NEXT_PUBLIC_NFT_STORAGE_KEY=$NFT_STORAGE_KEY

# Domain Configuration (update with your actual domain)
DOMAIN=localhost
EMAIL=admin@example.com

# Security Configuration
CORS_ORIGIN=https://your-domain.com

# Monitoring Configuration
LOG_LEVEL=info
ENABLE_MONITORING=true
EOF
    print_success "Created .env.production"
fi

# Export environment variable for docker-compose
export NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

print_status "Stopping existing containers..."
docker compose down || true

print_status "Building updated application..."
docker compose build --no-cache

print_status "Starting services..."
docker compose up -d

print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if docker compose ps | grep -q "Up"; then
    print_success "NFT.Storage integration deployed successfully!"
    print_status "Application is running at: http://localhost:3000"
    print_status "Check logs with: docker compose logs -f"
else
    print_error "Deployment failed. Check logs with: docker compose logs"
    exit 1
fi

print_success "NFT.Storage update completed!"
print_status "Your application now uses NFT.Storage instead of Pinata"
print_status "Benefits:"
print_status "  ✅ Free NFT storage"
print_status "  ✅ Permanent pinning on Filecoin"
print_status "  ✅ Built specifically for NFTs"