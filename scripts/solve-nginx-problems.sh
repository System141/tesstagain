#!/bin/bash

# Comprehensive Nginx Problem Solver
# Analyzes logs and fixes common nginx issues

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

# Function to backup current config
backup_nginx_config() {
    if [ -f "nginx/nginx.conf" ]; then
        local backup_name="nginx/nginx.conf.backup.$(date +%Y%m%d-%H%M%S)"
        cp nginx/nginx.conf "$backup_name"
        print_status "Backed up current config to: $backup_name"
    fi
}

# Function to test nginx config
test_nginx_config() {
    local config_file="${1:-nginx/nginx.conf}"
    print_status "Testing nginx configuration: $config_file"
    
    if docker run --rm -v "$(pwd)/$config_file":/etc/nginx/nginx.conf nginx:alpine nginx -t 2>/dev/null; then
        print_success "Configuration is valid ✓"
        return 0
    else
        print_error "Configuration is invalid ✗"
        docker run --rm -v "$(pwd)/$config_file":/etc/nginx/nginx.conf nginx:alpine nginx -t
        return 1
    fi
}

print_header "Nginx Problem Solver"

# Step 1: Get nginx logs
print_status "Collecting nginx error logs..."

ERROR_LOG_CONTENT=""
if docker compose ps | grep nginx | grep -q "Up"; then
    print_status "Getting logs from running nginx container..."
    ERROR_LOG_CONTENT=$(docker compose logs nginx --tail=100 2>&1)
elif docker ps | grep nginx | grep -q "Up"; then
    print_status "Getting logs from running nginx container (alternative)..."
    NGINX_CONTAINER=$(docker ps | grep nginx | awk '{print $1}' | head -1)
    ERROR_LOG_CONTENT=$(docker logs "$NGINX_CONTAINER" --tail=100 2>&1)
else
    print_warning "No running nginx container found"
    
    # Try to get logs from log files
    for log_path in "./nginx/logs/error.log" "./logs/nginx/error.log" "/var/log/nginx/error.log"; do
        if [ -f "$log_path" ]; then
            ERROR_LOG_CONTENT=$(tail -100 "$log_path")
            print_status "Found error log: $log_path"
            break
        fi
    done
fi

# Step 2: Analyze errors
print_header "Error Analysis"

if [ -z "$ERROR_LOG_CONTENT" ]; then
    print_warning "No error logs found. Testing configuration..."
    test_nginx_config
    exit 0
fi

echo "Recent nginx errors:"
echo "----------------------------------------"
echo "$ERROR_LOG_CONTENT" | tail -20
echo "----------------------------------------"

# Step 3: Identify and fix specific problems
PROBLEMS_FOUND=0

# Check for invalid value errors
if echo "$ERROR_LOG_CONTENT" | grep -q "invalid value"; then
    print_error "Problem 1: Invalid configuration values detected"
    echo "$ERROR_LOG_CONTENT" | grep "invalid value" | head -3
    ((PROBLEMS_FOUND++))
fi

# Check for upstream connection errors
if echo "$ERROR_LOG_CONTENT" | grep -q "connect() failed"; then
    print_error "Problem 2: Cannot connect to frontend container"
    echo "$ERROR_LOG_CONTENT" | grep "connect() failed" | head -3
    ((PROBLEMS_FOUND++))
fi

# Check for bind errors
if echo "$ERROR_LOG_CONTENT" | grep -q "bind() failed"; then
    print_error "Problem 3: Port binding issues"
    echo "$ERROR_LOG_CONTENT" | grep "bind() failed" | head -3
    ((PROBLEMS_FOUND++))
fi

# Check for SSL errors
if echo "$ERROR_LOG_CONTENT" | grep -q -E "(SSL_CTX|ssl_certificate)"; then
    print_error "Problem 4: SSL configuration issues"
    echo "$ERROR_LOG_CONTENT" | grep -E "(SSL_CTX|ssl_certificate)" | head -3
    ((PROBLEMS_FOUND++))
fi

# Check for directive errors
if echo "$ERROR_LOG_CONTENT" | grep -q "unknown directive"; then
    print_error "Problem 5: Unknown nginx directives"
    echo "$ERROR_LOG_CONTENT" | grep "unknown directive" | head -3
    ((PROBLEMS_FOUND++))
fi

# Step 4: Apply fixes
print_header "Applying Fixes"

if [ $PROBLEMS_FOUND -gt 0 ]; then
    print_status "Found $PROBLEMS_FOUND problem(s). Applying fixes..."
    
    # Backup current config
    backup_nginx_config
    
    # Try bulletproof configuration
    if [ -f "nginx/nginx-bulletproof.conf" ]; then
        print_status "Applying bulletproof nginx configuration..."
        cp nginx/nginx-bulletproof.conf nginx/nginx.conf
        
        if test_nginx_config; then
            print_success "Bulletproof configuration is valid!"
        else
            print_error "Even bulletproof config failed. Trying minimal config..."
            
            # Create absolute minimal config
            cat > nginx/nginx-minimal.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server jugiter-frontend:3000;
    }

    server {
        listen 80;
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
        }
    }
}
EOF
            cp nginx/nginx-minimal.conf nginx/nginx.conf
            
            if test_nginx_config; then
                print_success "Minimal configuration works!"
            else
                print_error "All configurations failed. Restoring backup..."
                # Restore the most recent backup
                LATEST_BACKUP=$(ls -t nginx/nginx.conf.backup.* 2>/dev/null | head -1)
                if [ ! -z "$LATEST_BACKUP" ]; then
                    cp "$LATEST_BACKUP" nginx/nginx.conf
                    print_status "Restored: $LATEST_BACKUP"
                fi
            fi
        fi
    fi
else
    print_success "No obvious configuration problems found"
    
    # Test current config anyway
    if ! test_nginx_config; then
        print_warning "Configuration test failed. Applying bulletproof config..."
        backup_nginx_config
        cp nginx/nginx-bulletproof.conf nginx/nginx.conf
        test_nginx_config
    fi
fi

# Step 5: Restart services
print_header "Restarting Services"

print_status "Stopping nginx container..."
docker compose stop nginx 2>/dev/null || true

print_status "Starting nginx with new configuration..."
docker compose up -d nginx

sleep 10

# Step 6: Verify fix
print_header "Verification"

if docker compose ps | grep nginx | grep -q "Up"; then
    print_success "Nginx is running!"
    
    # Test proxy functionality
    if curl -f http://localhost:8080/nginx-health &>/dev/null; then
        print_success "Nginx health check passed!"
    elif curl -f http://localhost:8080 &>/dev/null; then
        print_success "Nginx proxy is working!"
    else
        print_warning "Nginx is running but proxy may not be working"
        print_status "Check frontend container: docker compose ps"
    fi
    
    # Show final status
    print_status "Service status:"
    docker compose ps
    
    print_status "Access URLs:"
    print_status "  Direct frontend: http://$(hostname -I | awk '{print $1}'):3000"
    print_status "  Via nginx: http://$(hostname -I | awk '{print $1}'):8080"
    
else
    print_error "Nginx failed to start"
    print_status "Getting error logs..."
    docker compose logs nginx --tail=20
    
    print_header "Emergency Fallback"
    print_status "Starting without nginx (direct frontend access)..."
    docker compose up -d jugiter-frontend
    
    if docker compose ps | grep jugiter-frontend | grep -q "Up"; then
        print_success "Frontend is running directly on port 3000"
        print_status "Access at: http://$(hostname -I | awk '{print $1}'):3000"
    fi
fi

print_header "Summary"
print_status "For troubleshooting:"
print_status "  View nginx logs: docker compose logs nginx"
print_status "  Test config: docker run --rm -v \$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t"
print_status "  Restart services: docker compose restart"
print_success "Nginx problem solving completed!"