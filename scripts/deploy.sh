#!/bin/bash

# Jugiter NFT Launchpad Deployment Script
# This script deploys the application to a VPS server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="jugiter"
DOMAIN="${DOMAIN:-localhost}"
EMAIL="${EMAIL:-admin@example.com}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install packages to allow apt to use a repository over HTTPS
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your actual values before continuing"
        read -p "Press enter when you've updated the .env file..."
    fi
    
    # Create necessary directories
    mkdir -p logs nginx/ssl nginx/logs
    
    print_success "Environment setup completed"
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
        print_status "Setting up SSL with Let's Encrypt..."
        
        # Install certbot
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
        
        # Get SSL certificate
        sudo certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
        
        # Copy certificates to nginx directory
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
        sudo chown $USER:$USER nginx/ssl/*.pem
        
        # Update nginx config to use SSL
        sed -i "s/your-domain.com/$DOMAIN/g" nginx/nginx.conf
        sed -i 's|# ssl_certificate|ssl_certificate|g' nginx/nginx.conf
        sed -i 's|# ssl_certificate_key|ssl_certificate_key|g' nginx/nginx.conf
        sed -i 's|# ssl_protocols|ssl_protocols|g' nginx/nginx.conf
        sed -i 's|# ssl_ciphers|ssl_ciphers|g' nginx/nginx.conf
        sed -i 's|# ssl_prefer_server_ciphers|ssl_prefer_server_ciphers|g' nginx/nginx.conf
        
        print_success "SSL setup completed"
    else
        print_warning "Skipping SSL setup for localhost deployment"
    fi
}

# Function to build and start services
deploy_application() {
    print_status "Building and deploying application..."
    
    # Check if port 80 is available
    if ss -tlnp | grep -q ":80 "; then
        print_warning "Port 80 is already in use. Using simple deployment without nginx..."
        docker compose -f docker-compose.simple.yml down || true
        docker compose -f docker-compose.simple.yml build --no-cache
        docker compose -f docker-compose.simple.yml up -d
    else
        # Build and start services with nginx
        docker compose down || true
        docker compose build --no-cache
        docker compose up -d
    fi
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        print_success "Application deployed successfully!"
        print_status "Application is running at: http://$DOMAIN"
        if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
            print_status "Secure URL: https://$DOMAIN"
        fi
    else
        print_error "Deployment failed. Check logs with: docker compose logs"
        exit 1
    fi
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for Jugiter

LOG_FILE="/var/log/jugiter-monitor.log"

check_service() {
    if docker compose ps | grep -q "$1.*Up"; then
        echo "$(date): $1 is running" >> $LOG_FILE
        return 0
    else
        echo "$(date): $1 is down - restarting" >> $LOG_FILE
        docker compose restart $1
        return 1
    fi
}

# Check all services
check_service "jugiter-frontend"
check_service "jugiter-nginx"

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Warning - Disk usage is at ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f%%", $3*100/$2}' | sed 's/%//')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "$(date): Warning - Memory usage is at ${MEMORY_USAGE}%" >> $LOG_FILE
fi
EOF

    chmod +x monitor.sh
    
    # Setup cron job for monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * /path/to/jugiter/monitor.sh") | crontab -
    
    print_success "Monitoring setup completed"
}

# Main deployment process
main() {
    print_status "Starting Jugiter NFT Launchpad deployment..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please don't run this script as root"
        exit 1
    fi
    
    # Check and install dependencies
    if ! command_exists docker; then
        install_docker
        print_warning "Docker installed. Please log out and log back in, then run this script again."
        exit 0
    fi
    
    # Setup environment
    setup_environment
    
    # Setup SSL if needed
    setup_ssl
    
    # Deploy application
    deploy_application
    
    # Setup monitoring
    setup_monitoring
    
    print_success "Deployment completed successfully!"
    print_status "Useful commands:"
    print_status "  View logs: docker compose logs -f"
    print_status "  Restart services: docker compose restart"
    print_status "  Stop services: docker compose down"
    print_status "  Update application: git pull && docker compose up -d --build"
}

# Run main function
main "$@"