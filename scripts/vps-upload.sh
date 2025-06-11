#!/bin/bash

# Upload script for transferring files to VPS
# Usage: ./vps-upload.sh <VPS_IP> <SSH_USER>

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

VPS_IP="${1}"
SSH_USER="${2:-root}"

if [ -z "$VPS_IP" ]; then
    print_error "Usage: $0 <VPS_IP> [SSH_USER]"
    print_status "Example: $0 192.168.1.100 root"
    print_status "Example: $0 your-domain.com ubuntu"
    exit 1
fi

print_status "Uploading Jugiter project to VPS..."
print_status "Target: $SSH_USER@$VPS_IP"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the tesstagain project root directory"
    exit 1
fi

# Create temporary directory for upload
TEMP_DIR="/tmp/tesstagain-upload-$(date +%s)"
mkdir -p "$TEMP_DIR"

print_status "Preparing files for upload..."

# Copy essential files
cp -r frontend "$TEMP_DIR/"
cp -r nginx "$TEMP_DIR/"
cp -r scripts "$TEMP_DIR/"
cp docker-compose.yml "$TEMP_DIR/"
cp CLAUDE.md "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"

# Remove node_modules and build artifacts to reduce upload size
find "$TEMP_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR" -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true

print_status "Uploading files via SCP..."

# Upload files
scp -r "$TEMP_DIR"/* "$SSH_USER@$VPS_IP:/tmp/"

if [ $? -ne 0 ]; then
    print_error "Failed to upload files"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Clean up
rm -rf "$TEMP_DIR"

print_success "Files uploaded successfully!"
print_status ""
print_status "Next steps on your VPS:"
print_status "1. SSH to your VPS: ssh $SSH_USER@$VPS_IP"
print_status "2. Move files: sudo mv /tmp/* /root/tesstagain/ (create directory first)"
print_status "3. Make script executable: chmod +x /root/tesstagain/scripts/vps-deploy.sh"
print_status "4. Run deployment: sudo /root/tesstagain/scripts/vps-deploy.sh YOUR_PINATA_API_KEY YOUR_PINATA_SECRET"
print_status ""
print_warning "Make sure you have your Pinata API credentials ready!"