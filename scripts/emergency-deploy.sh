#!/bin/bash

# Emergency deployment with simple nginx config or no nginx

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Get NFT.Storage key
NFT_STORAGE_KEY="${1:-$NEXT_PUBLIC_NFT_STORAGE_KEY}"

if [ -z "$NFT_STORAGE_KEY" ]; then
    print_error "NFT.Storage API key required!"
    echo "Usage: $0 <nft-storage-api-key>"
    exit 1
fi

export NEXT_PUBLIC_NFT_STORAGE_KEY="$NFT_STORAGE_KEY"

print_status "Emergency deployment starting..."

# Pull latest
print_status "Pulling latest fixes..."
git pull origin vpstest

# Stop everything
print_status "Stopping all services..."
docker compose down --remove-orphans || true

# Option 1: Try with simple nginx
print_status "Option 1: Trying with simple nginx configuration..."
if [ -f "nginx/nginx-simple.conf" ]; then
    cp nginx/nginx.conf nginx/nginx.conf.backup
    cp nginx/nginx-simple.conf nginx/nginx.conf
    print_status "Using simple nginx configuration..."
    
    docker compose up -d
    sleep 15
    
    if docker compose ps | grep nginx | grep -q "Up"; then
        print_success "Simple nginx configuration works!"
        print_status "App available at: http://$(hostname -I | awk '{print $1}'):8080"
        exit 0
    else
        print_warning "Simple nginx also failed, trying without nginx..."
        docker compose down
        if [ -f "nginx/nginx.conf.backup" ]; then
            mv nginx/nginx.conf.backup nginx/nginx.conf
        fi
    fi
fi

# Option 2: Use simple compose without nginx
print_status "Option 2: Deploying without nginx (direct frontend access)..."

cat > docker-compose-emergency.yml << 'EOF'
services:
  jugiter-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_NFT_STORAGE_KEY=${NEXT_PUBLIC_NFT_STORAGE_KEY}
    container_name: jugiter-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "8080:3000"  # Alternative port
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_NFT_STORAGE_KEY=${NEXT_PUBLIC_NFT_STORAGE_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
EOF

print_status "Building and starting frontend only..."
docker compose -f docker-compose-emergency.yml build --no-cache
docker compose -f docker-compose-emergency.yml up -d

sleep 20

if docker compose -f docker-compose-emergency.yml ps | grep -q "Up"; then
    print_success "Emergency deployment successful!"
    print_status "Frontend available at:"
    print_status "  http://$(hostname -I | awk '{print $1}'):3000"
    print_status "  http://$(hostname -I | awk '{print $1}'):8080"
    print_status "  http://localhost:3000"
    
    # Test health
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed, but service is running"
    fi
    
    print_status "Check logs: docker compose -f docker-compose-emergency.yml logs -f"
else
    print_error "Emergency deployment failed!"
    docker compose -f docker-compose-emergency.yml logs
    exit 1
fi

print_success "Emergency deployment completed!"
print_warning "Note: Running without nginx. For production, fix nginx configuration."