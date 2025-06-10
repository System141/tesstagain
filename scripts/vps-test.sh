#!/bin/bash

# Comprehensive VPS Testing Script for NFT.Storage Application
# Run this script on your VPS: system141@195.26.249.142

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

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

test_result() {
    if [ $1 -eq 0 ]; then
        print_success "$2"
        ((TESTS_PASSED++))
    else
        print_error "$2"
        ((TESTS_FAILED++))
        FAILED_TESTS+=("$2")
    fi
}

# System Information
print_header "VPS System Information"
print_status "Hostname: $(hostname)"
print_status "IP Address: $(hostname -I | awk '{print $1}')"
print_status "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
print_status "Kernel: $(uname -r)"
print_status "Uptime: $(uptime)"
echo

# Test 1: Check if we're in the right directory
print_header "Test 1: Project Directory Check"
if [ -f "docker-compose.yml" ] && [ -f "frontend/package.json" ]; then
    test_result 0 "Project files found"
    PROJECT_ROOT=$(pwd)
    print_status "Project root: $PROJECT_ROOT"
else
    test_result 1 "Project files not found - please navigate to tesstagain directory"
fi
echo

# Test 2: Docker availability
print_header "Test 2: Docker System Check"
if command -v docker &> /dev/null; then
    test_result 0 "Docker is installed"
    print_status "Docker version: $(docker --version)"
    
    if docker info &> /dev/null; then
        test_result 0 "Docker daemon is running"
    else
        test_result 1 "Docker daemon is not running"
        print_status "Attempting to start Docker..."
        sudo systemctl start docker
        sleep 5
        if docker info &> /dev/null; then
            test_result 0 "Docker daemon started successfully"
        else
            test_result 1 "Failed to start Docker daemon"
        fi
    fi
else
    test_result 1 "Docker is not installed"
fi
echo

# Test 3: Docker Compose availability
print_header "Test 3: Docker Compose Check"
if docker compose version &> /dev/null; then
    test_result 0 "Docker Compose is available"
    print_status "Docker Compose version: $(docker compose version)"
elif command -v docker-compose &> /dev/null; then
    test_result 0 "Docker Compose (standalone) is available"
    print_status "Docker Compose version: $(docker-compose --version)"
else
    test_result 1 "Docker Compose is not available"
fi
echo

# Test 4: Git and code status
print_header "Test 4: Git Repository Status"
if git status &> /dev/null; then
    test_result 0 "Git repository is valid"
    print_status "Current branch: $(git branch --show-current)"
    print_status "Latest commit: $(git log -1 --oneline)"
    
    # Check if we need to pull updates
    git fetch origin &> /dev/null
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]; then
        print_warning "Updates available from remote"
        print_status "Pulling latest changes..."
        git pull origin $(git branch --show-current)
    else
        print_status "Repository is up to date"
    fi
else
    test_result 1 "Not in a git repository"
fi
echo

# Test 5: Environment variables
print_header "Test 5: Environment Variables Check"
if [ ! -z "$NEXT_PUBLIC_NFT_STORAGE_KEY" ]; then
    test_result 0 "NEXT_PUBLIC_NFT_STORAGE_KEY is set"
    print_status "NFT.Storage key: ${NEXT_PUBLIC_NFT_STORAGE_KEY:0:8}..."
else
    test_result 1 "NEXT_PUBLIC_NFT_STORAGE_KEY not set"
    
    # Check for .env file
    if [ -f ".env" ]; then
        if grep -q "NEXT_PUBLIC_NFT_STORAGE_KEY" .env; then
            print_status "Found NFT.Storage key in .env file"
            source .env
            if [ ! -z "$NEXT_PUBLIC_NFT_STORAGE_KEY" ]; then
                test_result 0 "NFT.Storage key loaded from .env"
                export NEXT_PUBLIC_NFT_STORAGE_KEY
            fi
        fi
    fi
fi
echo

# Test 6: Network connectivity
print_header "Test 6: Network Connectivity"
if curl -s --connect-timeout 5 https://api.nft.storage &> /dev/null; then
    test_result 0 "NFT.Storage API is reachable"
else
    test_result 1 "Cannot reach NFT.Storage API"
fi

if curl -s --connect-timeout 5 https://ipfs.io &> /dev/null; then
    test_result 0 "IPFS gateway is reachable"
else
    test_result 1 "Cannot reach IPFS gateway"
fi
echo

# Test 7: Port availability
print_header "Test 7: Port Availability Check"
for port in 3000 8080 80 443; do
    if ! netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
        test_result 0 "Port $port is available"
    else
        test_result 1 "Port $port is in use"
        print_status "Process using port $port: $(netstat -tlnp 2>/dev/null | grep ":${port} " | awk '{print $7}')"
    fi
done
echo

# Test 8: Current container status
print_header "Test 8: Current Container Status"
if docker compose ps &> /dev/null; then
    RUNNING_CONTAINERS=$(docker compose ps --services --filter "status=running")
    if [ ! -z "$RUNNING_CONTAINERS" ]; then
        print_status "Currently running containers:"
        docker compose ps
        test_result 0 "Some containers are running"
    else
        test_result 1 "No containers are currently running"
    fi
else
    test_result 1 "Cannot check container status"
fi
echo

# Test 9: Application deployment test
print_header "Test 9: Application Deployment Test"
if [ ! -z "$NEXT_PUBLIC_NFT_STORAGE_KEY" ]; then
    print_status "Attempting to deploy application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker compose down &> /dev/null || true
    
    # Try emergency deployment
    if [ -f "scripts/emergency-deploy.sh" ]; then
        print_status "Running emergency deployment..."
        if ./scripts/emergency-deploy.sh "$NEXT_PUBLIC_NFT_STORAGE_KEY" &> /tmp/deploy.log; then
            test_result 0 "Emergency deployment succeeded"
        else
            test_result 1 "Emergency deployment failed"
            print_status "Deployment log:"
            tail -20 /tmp/deploy.log
        fi
    else
        # Manual deployment
        print_status "Manual deployment attempt..."
        if docker compose build --no-cache &> /tmp/build.log && docker compose up -d &> /tmp/startup.log; then
            sleep 20
            if docker compose ps | grep -q "Up"; then
                test_result 0 "Manual deployment succeeded"
            else
                test_result 1 "Containers failed to start"
            fi
        else
            test_result 1 "Build or startup failed"
        fi
    fi
else
    test_result 1 "Cannot deploy without NFT.Storage key"
fi
echo

# Test 10: Application health check
print_header "Test 10: Application Health Check"
sleep 10  # Give services time to start

# Check if frontend is accessible
if curl -f http://localhost:3000/api/health &> /dev/null; then
    test_result 0 "Frontend health check passed (port 3000)"
elif curl -f http://localhost:8080/api/health &> /dev/null; then
    test_result 0 "Frontend health check passed (port 8080)"
else
    test_result 1 "Frontend health check failed"
fi

# Check if main page loads
if curl -s http://localhost:3000 | grep -q "Jugiter" &> /dev/null; then
    test_result 0 "Main page loads correctly"
elif curl -s http://localhost:8080 | grep -q "Jugiter" &> /dev/null; then
    test_result 0 "Main page loads correctly (via nginx)"
else
    test_result 1 "Main page does not load"
fi
echo

# Test Summary
print_header "Test Summary"
print_status "Tests passed: $TESTS_PASSED"
print_status "Tests failed: $TESTS_FAILED"

if [ $TESTS_FAILED -gt 0 ]; then
    print_error "Failed tests:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
    done
fi

echo
if [ $TESTS_FAILED -eq 0 ]; then
    print_success "🎉 All tests passed! Your NFT.Storage application is working!"
    print_status "Access URLs:"
    print_status "  http://195.26.249.142:3000"
    print_status "  http://195.26.249.142:8080"
elif [ $TESTS_FAILED -le 3 ]; then
    print_warning "⚠️  Some tests failed, but application might still work"
    print_status "Try accessing: http://195.26.249.142:3000"
else
    print_error "❌ Multiple critical tests failed"
    print_status "Check logs with: docker compose logs"
fi

echo
print_status "For troubleshooting:"
print_status "  View logs: docker compose logs -f"
print_status "  Restart: docker compose restart"
print_status "  Rebuild: docker compose up -d --build"
print_status "  Emergency: ./scripts/emergency-deploy.sh <nft-key>"