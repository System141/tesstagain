#!/bin/bash

# VPS Deployment Script for Jugiter NFT Launchpad
# Usage: ./vps-deploy.sh <PINATA_API_KEY> <PINATA_SECRET_KEY>

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

# Configuration
PINATA_API_KEY="${PINATA_API_KEY:-$1}"
PINATA_SECRET_KEY="${PINATA_SECRET_KEY:-$2}"
APP_DIR="/opt/tesstagain"
SERVICE_USER="jugiter"

print_header "Jugiter NFT Launchpad - VPS Deployment"

# Validate inputs
if [ -z "$PINATA_API_KEY" ] || [ -z "$PINATA_SECRET_KEY" ]; then
    print_error "Usage: $0 <PINATA_API_KEY> <PINATA_SECRET_KEY>"
    print_status "Example: $0 your_pinata_api_key your_pinata_secret_key"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_status "Starting VPS deployment..."
print_status "Target directory: $APP_DIR"

print_header "Step 1: System Update & Dependencies"

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw nodejs npm

# Install Docker
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    rm get-docker.sh
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_success "Docker Compose already installed"
fi

print_header "Step 2: User Setup"

# Create application user
if ! id "$SERVICE_USER" &>/dev/null; then
    print_status "Creating service user: $SERVICE_USER"
    useradd -r -m -s /bin/bash "$SERVICE_USER"
    usermod -aG docker "$SERVICE_USER"
    print_success "User $SERVICE_USER created"
else
    print_success "User $SERVICE_USER already exists"
fi

print_header "Step 3: Application Setup"

# Create application directory
print_status "Setting up application directory..."
mkdir -p "$APP_DIR"
chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Copy application files (this assumes you've already uploaded the code)
if [ -d "/home/$(logname)/tesstagain" ]; then
    print_status "Copying application files..."
    cp -r /home/$(logname)/tesstagain/* "$APP_DIR/"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
elif [ -d "/root/tesstagain" ]; then
    print_status "Copying application files from /root..."
    cp -r /root/tesstagain/* "$APP_DIR/"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
else
    print_status "Application files not found. Please upload your tesstagain project to the VPS first."
    print_status "You can use: scp -r ./tesstagain user@your-vps-ip:/tmp/"
    print_status "Then run this script again."
    exit 1
fi

print_header "Step 4: Environment Configuration"

# Create environment file
print_status "Creating environment configuration..."
cat > "$APP_DIR/frontend/.env.local" << EOF
# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=${PINATA_API_KEY}
NEXT_PUBLIC_PINATA_SECRET_KEY=${PINATA_SECRET_KEY}

# Production environment
NODE_ENV=production

# NFT.Storage is deprecated - uploads decommissioned June 30, 2024
# NEXT_PUBLIC_NFT_STORAGE_KEY=no_longer_functional
EOF

chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/frontend/.env.local"
chmod 600 "$APP_DIR/frontend/.env.local"

print_success "Environment configured"

print_header "Step 5: Docker Setup"

cd "$APP_DIR"

# Build the application
print_status "Building Docker containers..."
sudo -u "$SERVICE_USER" docker-compose build --no-cache \
    --build-arg NEXT_PUBLIC_PINATA_API_KEY="$PINATA_API_KEY" \
    --build-arg NEXT_PUBLIC_PINATA_SECRET_KEY="$PINATA_SECRET_KEY"

if [ $? -ne 0 ]; then
    print_error "Docker build failed"
    exit 1
fi

print_success "Docker build completed"

print_header "Step 6: Firewall Configuration"

# Configure UFW firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Direct access for testing
ufw allow 8080/tcp  # Nginx proxy
print_success "Firewall configured"

print_header "Step 7: Nginx Configuration"

# Create Nginx configuration
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/jugiter << 'EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Proxy settings for large files
    client_max_body_size 100M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_buffer_size 4k;
    proxy_buffers 16 4k;
    proxy_busy_buffers_size 8k;

    # Special handling for large Next.js chunks
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Large buffer for JS chunks
        proxy_buffer_size 8k;
        proxy_buffers 32 8k;
        proxy_busy_buffers_size 16k;
        
        # Caching
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API and dynamic routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/jugiter /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    print_error "Nginx configuration test failed"
    exit 1
fi

systemctl restart nginx
systemctl enable nginx
print_success "Nginx configured and started"

print_header "Step 8: Service Creation"

# Create systemd service
print_status "Creating systemd service..."
cat > /etc/systemd/system/jugiter.service << EOF
[Unit]
Description=Jugiter NFT Launchpad
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$SERVICE_USER
Group=$SERVICE_USER

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable jugiter
print_success "Systemd service created"

print_header "Step 9: Application Startup"

# Start the application
print_status "Starting Jugiter application..."
cd "$APP_DIR"
sudo -u "$SERVICE_USER" docker-compose up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start application"
    exit 1
fi

# Wait for application to start
print_status "Waiting for application to start..."
sleep 30

print_header "Step 10: Health Checks"

# Health check
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        print_success "✅ Application is healthy on port 3000"
        break
    elif curl -f http://localhost:80 &> /dev/null; then
        print_success "✅ Application is healthy via Nginx on port 80"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_status "Health check attempt $RETRY_COUNT/$MAX_RETRIES..."
        sleep 2
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed after $MAX_RETRIES attempts"
    print_status "Checking container status..."
    cd "$APP_DIR"
    sudo -u "$SERVICE_USER" docker-compose ps
    print_status "Checking logs..."
    sudo -u "$SERVICE_USER" docker-compose logs --tail=50
    exit 1
fi

print_header "Step 11: SSL Setup (Optional)"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your-server-ip")

print_status "SSL certificate setup is optional and requires a domain name."
print_status "If you have a domain pointing to this server, you can run:"
print_status "  certbot --nginx -d yourdomain.com"
print_status ""

print_header "Deployment Complete!"

print_success "🎉 Jugiter NFT Launchpad deployed successfully!"
print_status ""
print_status "📋 Access Information:"
print_status "  Direct access: http://$SERVER_IP:3000"
print_status "  Nginx proxy:  http://$SERVER_IP:80"
print_status "  Local access: http://localhost:3000"
print_status ""
print_status "🔧 Management Commands:"
print_status "  Start:   systemctl start jugiter"
print_status "  Stop:    systemctl stop jugiter"
print_status "  Restart: systemctl restart jugiter"
print_status "  Status:  systemctl status jugiter"
print_status "  Logs:    cd $APP_DIR && docker-compose logs -f"
print_status ""
print_status "🚀 Features Deployed:"
print_status "  ✨ Clean, minimal UI design"
print_status "  🎨 Simplified navigation and cards"
print_status "  🔧 NFT collection creation and minting"
print_status "  📦 IPFS integration via Pinata"
print_status "  🌐 Nginx reverse proxy with optimizations"
print_status "  🔒 Security headers and firewall"
print_status "  🐳 Docker containerization"
print_status ""
print_success "Your NFT launchpad is now live with the redesigned clean interface!"