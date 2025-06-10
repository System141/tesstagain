#!/bin/bash

# VPS Troubleshooting Script for NFT.Storage Deployment
# This script diagnoses and fixes common deployment issues

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

print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check system requirements
check_system() {
    print_section "System Requirements Check"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
        
        # Check if Docker daemon is running
        if docker info &> /dev/null; then
            print_success "Docker daemon is running"
        else
            print_error "Docker daemon is not running"
            print_status "Starting Docker daemon..."
            sudo systemctl start docker
            sudo systemctl enable docker
        fi
    else
        print_error "Docker is not installed"
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        print_warning "Please log out and log back in for Docker group changes to take effect"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose found"
    else
        print_error "Docker Compose not found"
        print_status "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Check disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        print_warning "Disk usage is at ${DISK_USAGE}% - consider cleaning up"
    else
        print_success "Disk space OK (${DISK_USAGE}% used)"
    fi
    
    # Check memory
    MEMORY_TOTAL=$(free -h | awk 'NR==2{print $2}')
    MEMORY_USED=$(free -h | awk 'NR==2{print $3}')
    print_success "Memory: $MEMORY_USED used of $MEMORY_TOTAL"
}

# Function to check project structure
check_project() {
    print_section "Project Structure Check"
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in current directory"
        print_status "Current directory: $(pwd)"
        print_status "Please navigate to the project root directory"
        exit 1
    else
        print_success "docker-compose.yml found"
    fi
    
    if [ ! -f "frontend/Dockerfile" ]; then
        print_error "frontend/Dockerfile not found"
        exit 1
    else
        print_success "frontend/Dockerfile found"
    fi
    
    if [ ! -f "frontend/package.json" ]; then
        print_error "frontend/package.json not found"
        exit 1
    else
        print_success "frontend/package.json found"
    fi
}

# Function to check environment variables
check_environment() {
    print_section "Environment Variables Check"
    
    if [ -z "$NEXT_PUBLIC_NFT_STORAGE_KEY" ]; then
        print_warning "NEXT_PUBLIC_NFT_STORAGE_KEY not set in environment"
        
        if [ -f ".env" ]; then
            if grep -q "NEXT_PUBLIC_NFT_STORAGE_KEY" .env; then
                print_status "Found NFT_STORAGE_KEY in .env file"
                source .env
            else
                print_error "NFT_STORAGE_KEY not found in .env file"
            fi
        else
            print_warning ".env file not found"
        fi
    else
        print_success "NEXT_PUBLIC_NFT_STORAGE_KEY is set"
    fi
}

# Function to check Docker containers
check_containers() {
    print_section "Docker Containers Check"
    
    # Show running containers
    print_status "Currently running containers:"
    docker ps || print_error "Failed to list containers"
    
    # Show all containers (including stopped)
    print_status "All containers:"
    docker ps -a || print_error "Failed to list all containers"
    
    # Check specific containers
    if docker ps | grep -q "jugiter-frontend"; then
        print_success "jugiter-frontend container is running"
    else
        print_warning "jugiter-frontend container is not running"
    fi
    
    if docker ps | grep -q "jugiter-nginx"; then
        print_success "jugiter-nginx container is running"
    else
        print_warning "jugiter-nginx container is not running"
    fi
}

# Function to check logs
check_logs() {
    print_section "Container Logs Check"
    
    print_status "Frontend container logs (last 20 lines):"
    docker compose logs --tail=20 jugiter-frontend || print_error "Failed to get frontend logs"
    
    print_status "Nginx container logs (last 20 lines):"
    docker compose logs --tail=20 nginx || print_warning "Nginx logs not available"
}

# Function to check network connectivity
check_network() {
    print_section "Network Connectivity Check"
    
    # Check if ports are available
    if netstat -tlnp | grep -q ":3000"; then
        print_success "Port 3000 is in use"
    else
        print_warning "Port 3000 is not in use"
    fi
    
    if netstat -tlnp | grep -q ":8080"; then
        print_success "Port 8080 is in use"
    else
        print_warning "Port 8080 is not in use"
    fi
    
    # Test NFT.Storage connectivity
    if curl -s --connect-timeout 5 https://api.nft.storage > /dev/null; then
        print_success "NFT.Storage API is reachable"
    else
        print_error "Cannot reach NFT.Storage API"
    fi
}

# Function to fix common issues
fix_issues() {
    print_section "Attempting to Fix Common Issues"
    
    print_status "Stopping all containers..."
    docker compose down || true
    
    print_status "Cleaning up Docker system..."
    docker system prune -f || true
    
    print_status "Removing unused images..."
    docker image prune -f || true
    
    print_status "Removing unused volumes..."
    docker volume prune -f || true
    
    # Check if NFT.Storage key is available
    if [ -z "$NEXT_PUBLIC_NFT_STORAGE_KEY" ]; then
        print_error "NFT.Storage API key is required!"
        print_status "Please set it with:"
        print_status "export NEXT_PUBLIC_NFT_STORAGE_KEY='your_key_here'"
        print_status "Or add it to .env file"
        return 1
    fi
    
    print_status "Building containers with NFT.Storage configuration..."
    docker compose build --no-cache --build-arg NEXT_PUBLIC_NFT_STORAGE_KEY="$NEXT_PUBLIC_NFT_STORAGE_KEY"
    
    print_status "Starting containers..."
    docker compose up -d
    
    print_status "Waiting for containers to start..."
    sleep 30
    
    print_status "Checking container health..."
    docker compose ps
}

# Function to show status
show_status() {
    print_section "Final Status Check"
    
    if docker compose ps | grep -q "Up"; then
        print_success "Application is running!"
        print_status "Access URLs:"
        print_status "  Direct: http://$(curl -s ifconfig.me):3000"
        print_status "  Via Nginx: http://$(curl -s ifconfig.me):8080"
        print_status "  Local: http://localhost:3000"
    else
        print_error "Application is not running properly"
        print_status "Check logs with: docker compose logs"
    fi
}

# Main execution
main() {
    print_status "Starting VPS troubleshooting..."
    
    check_system
    check_project
    check_environment
    check_containers
    check_logs
    check_network
    
    echo ""
    read -p "Do you want to attempt automatic fixes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        fix_issues
        show_status
    else
        print_status "Skipping automatic fixes"
    fi
    
    print_success "Troubleshooting completed!"
    print_status "For manual debugging:"
    print_status "  View all logs: docker compose logs -f"
    print_status "  Restart services: docker compose restart"
    print_status "  Rebuild: docker compose up -d --build"
}

# Run main function
main "$@"