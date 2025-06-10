#!/bin/bash

# Fix Nginx configuration and restart services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_status "Fixing Nginx configuration error..."

# Pull latest fixes
print_status "Pulling latest nginx fixes..."
git pull origin vpstest

# Test nginx configuration
print_status "Testing nginx configuration..."
if docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t; then
    print_success "Nginx configuration is valid!"
else
    print_error "Nginx configuration is still invalid!"
    exit 1
fi

# Stop containers
print_status "Stopping containers..."
docker compose down

# Start containers with fixed nginx
print_status "Starting containers with fixed nginx..."
docker compose up -d

# Wait for startup
print_status "Waiting for services to start..."
sleep 15

# Check if nginx is running
if docker compose ps | grep nginx | grep -q "Up"; then
    print_success "Nginx is running successfully!"
    docker compose ps
else
    print_error "Nginx failed to start!"
    docker compose logs nginx
    exit 1
fi

# Test nginx access
print_status "Testing nginx proxy..."
if curl -f http://localhost:8080 &>/dev/null; then
    print_success "Nginx proxy is working!"
    print_status "Access your app at: http://$(hostname -I | awk '{print $1}'):8080"
else
    print_error "Nginx proxy test failed"
    docker compose logs nginx --tail=10
fi

print_success "Nginx fix completed!"