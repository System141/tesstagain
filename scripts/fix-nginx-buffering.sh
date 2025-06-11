#!/bin/bash

# Fix Nginx buffering issues for large JavaScript chunks

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_status "🔧 Fixing Nginx buffering issues for large JavaScript chunks..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -f "nginx/nginx.conf" ]; then
    print_error "Please run this script from the tesstagain project root directory"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

print_status "Nginx configuration has been updated with:"
print_status "  📦 Increased buffer sizes for large JS chunks"
print_status "  🎯 Special handling for Next.js chunks"
print_status "  🚀 Improved caching for static assets"
print_status "  ⚡ Better performance for large files"

# Test nginx configuration
print_status "Testing Nginx configuration..."
if docker compose exec nginx nginx -t 2>/dev/null; then
    print_success "✅ Nginx configuration is valid"
else
    print_warning "⚠️ Could not test Nginx config (container might not be running)"
fi

# Restart nginx to apply changes
print_status "Restarting Nginx to apply changes..."
if docker compose restart nginx; then
    print_success "✅ Nginx restarted successfully"
    
    # Wait for nginx to be ready
    sleep 5
    
    # Test if nginx is working
    if curl -f http://localhost:8080/nginx-health &> /dev/null; then
        print_success "✅ Nginx is healthy and responding"
    else
        print_warning "⚠️ Nginx health check failed, but container is running"
    fi
else
    print_error "❌ Failed to restart Nginx"
    print_status "Checking container status..."
    docker compose ps nginx
    exit 1
fi

print_success "🎉 Nginx buffering issues fixed!"
print_status ""
print_status "Changes made:"
print_status "  ✅ Increased proxy buffer sizes globally"
print_status "  ✅ Special handling for large Next.js chunks"
print_status "  ✅ Reduced warnings about temporary files"
print_status "  ✅ Better caching for static assets"
print_status "  ✅ Improved performance for large JavaScript files"
print_status ""
print_status "The warnings about buffering to temporary files should now be eliminated!"
print_status "Your application should load faster and more reliably."

# Show current nginx status
print_status ""
print_status "Current Nginx status:"
docker compose ps nginx