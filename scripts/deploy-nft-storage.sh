#!/bin/bash

# Deploy NFT.Storage Updates to VPS
# This script deploys the updated NFT.Storage configuration

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
if [ -z "$NFT_STORAGE_KEY" ] && [ -z "$1" ]; then
    print_error "Please provide your NFT.Storage API key"
    echo "Usage: NFT_STORAGE_KEY=your_key $0"
    echo "   or: $0 your_key"
    echo ""
    echo "Get your free API key from: https://nft.storage"
    exit 1
fi

# Use provided key or environment variable
NFT_STORAGE_KEY="${1:-$NFT_STORAGE_KEY}"

print_status "Deploying NFT.Storage configuration to VPS..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Export environment variable for docker-compose
export NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

print_status "Using NFT.Storage API key: ${NFT_STORAGE_KEY:0:8}..."

# Stop existing containers
print_status "Stopping existing containers..."
docker compose down || true

# Clean up old images to force rebuild
print_status "Cleaning up old images..."
docker system prune -f || true

# Build with NFT.Storage configuration
print_status "Building application with NFT.Storage support..."
docker compose build --no-cache --build-arg NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

# Start services
print_status "Starting services..."
docker compose up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if docker compose ps | grep -q "Up"; then
    print_success "NFT.Storage deployment completed successfully!"
    
    # Show running services
    print_status "Running services:"
    docker compose ps
    
    print_status "Application URLs:"
    print_status "  Frontend: http://localhost:3000"
    print_status "  With Nginx: http://localhost:8080"
    
    print_status "Check logs with: docker compose logs -f"
    
    print_success "Your application now uses NFT.Storage for IPFS uploads!"
    print_status "Benefits:"
    print_status "  ✅ Free NFT storage"
    print_status "  ✅ Permanent pinning on Filecoin"
    print_status "  ✅ Built specifically for NFTs"
    print_status "  ✅ No rate limits like Pinata"
    
else
    print_error "Deployment failed. Check logs with: docker compose logs"
    docker compose logs
    exit 1
fi

print_success "NFT.Storage deployment completed!"