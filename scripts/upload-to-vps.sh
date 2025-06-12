#!/bin/bash

# Upload changes to VPS and deploy UI updates
# Usage: ./scripts/upload-to-vps.sh <VPS_IP> <VPS_USER>

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

# Check arguments
VPS_IP=$1
VPS_USER=$2

if [ -z "$VPS_IP" ] || [ -z "$VPS_USER" ]; then
    print_error "Usage: $0 <VPS_IP> <VPS_USER>"
    print_status "Example: $0 192.168.1.100 ubuntu"
    print_status "Example: $0 your-domain.com root"
    exit 1
fi

print_header "Upload and Deploy UI Updates to VPS"

print_status "Target VPS: $VPS_USER@$VPS_IP"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the tesstagain project root directory"
    exit 1
fi

# Create a clean build directory
print_status "Preparing files for upload..."
TEMP_DIR="/tmp/tesstagain-deploy-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy only necessary files (exclude node_modules, .git, etc.)
print_status "Copying project files..."
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='.next' \
          --exclude='dist' \
          --exclude='build' \
          --exclude='logs' \
          --exclude='*.log' \
          --exclude='.env.local' \
          . "$TEMP_DIR/"

print_success "Files prepared for upload"

# Upload to VPS
print_status "Uploading to VPS..."
rsync -avz --delete "$TEMP_DIR/" "$VPS_USER@$VPS_IP:/opt/tesstagain/"

if [ $? -ne 0 ]; then
    print_error "Upload failed"
    rm -rf "$TEMP_DIR"
    exit 1
fi

print_success "Files uploaded successfully"

# Clean up temp directory
rm -rf "$TEMP_DIR"

# Execute deployment on VPS
print_status "Executing deployment on VPS..."
ssh "$VPS_USER@$VPS_IP" << 'EOF'
cd /opt/tesstagain

# Make sure we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Not in tesstagain directory"
    exit 1
fi

# Make script executable
chmod +x scripts/deploy-ui-updates.sh

# Run the deployment
./scripts/deploy-ui-updates.sh
EOF

if [ $? -eq 0 ]; then
    print_success "🎉 Deployment completed successfully!"
    print_status ""
    print_status "Your updated UI is now live on the VPS:"
    print_status "  🌐 http://$VPS_IP:3000 (Direct)"
    print_status "  🌐 http://$VPS_IP:8080 (Nginx Proxy)"
    print_status ""
    print_status "Changes deployed:"
    print_status "  ❌ Removed 'Mint NFT' option from marketplace"
    print_status "  ❌ Removed 'Browse & Trade' buttons"
    print_status "  ✅ Updated main page stats to show real platform info"
    print_status "  🎨 Simplified marketplace interface"
else
    print_error "Deployment failed on VPS"
    print_status "You can check the logs by running:"
    print_status "  ssh $VPS_USER@$VPS_IP 'cd /opt/tesstagain && docker compose logs'"
    exit 1
fi