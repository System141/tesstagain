#!/bin/bash

# Nginx Log Analyzer and Problem Solver
# This script analyzes nginx error logs and provides solutions

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

print_header "Nginx Log Analyzer and Problem Solver"

# Check if we can access nginx logs
LOG_PATHS=(
    "./nginx/logs/error.log"
    "./logs/nginx/error.log" 
    "/var/log/nginx/error.log"
    "nginx/error.log"
)

NGINX_ERROR_LOG=""
for path in "${LOG_PATHS[@]}"; do
    if [ -f "$path" ]; then
        NGINX_ERROR_LOG="$path"
        print_status "Found nginx error log: $path"
        break
    fi
done

# If no log file found, check Docker logs
if [ -z "$NGINX_ERROR_LOG" ]; then
    print_warning "No nginx error log file found locally"
    print_status "Checking Docker nginx logs..."
    
    if docker compose ps | grep nginx | grep -q "Up"; then
        print_status "Getting nginx container logs..."
        docker compose logs nginx --tail=50 > /tmp/nginx_docker.log 2>&1
        NGINX_ERROR_LOG="/tmp/nginx_docker.log"
        print_status "Nginx container logs saved to: $NGINX_ERROR_LOG"
    elif docker ps | grep nginx | grep -q "Up"; then
        print_status "Getting nginx container logs (alternative method)..."
        docker logs $(docker ps | grep nginx | awk '{print $1}') --tail=50 > /tmp/nginx_docker.log 2>&1
        NGINX_ERROR_LOG="/tmp/nginx_docker.log"
    else
        print_error "No running nginx container found"
        print_status "Creating a test to check nginx configuration..."
        
        # Test nginx configuration without running container
        if [ -f "nginx/nginx.conf" ]; then
            print_status "Testing nginx configuration..."
            docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t > /tmp/nginx_test.log 2>&1 || true
            NGINX_ERROR_LOG="/tmp/nginx_test.log"
            print_status "Nginx configuration test saved to: $NGINX_ERROR_LOG"
        fi
    fi
fi

if [ -z "$NGINX_ERROR_LOG" ] || [ ! -f "$NGINX_ERROR_LOG" ]; then
    print_error "Cannot find or access nginx error logs"
    exit 1
fi

print_header "Analyzing Nginx Error Log: $NGINX_ERROR_LOG"

# Display recent log entries
print_status "Recent nginx log entries:"
echo "----------------------------------------"
tail -30 "$NGINX_ERROR_LOG"
echo "----------------------------------------"

# Analyze common error patterns
print_header "Error Analysis and Solutions"

# Check for configuration errors
if grep -q "invalid value" "$NGINX_ERROR_LOG"; then
    print_error "Configuration Error Detected: Invalid directive value"
    
    # Extract the specific error
    INVALID_LINES=$(grep "invalid value" "$NGINX_ERROR_LOG" | head -5)
    echo "Details:"
    echo "$INVALID_LINES"
    
    # Check for gzip_proxied issues
    if echo "$INVALID_LINES" | grep -q "gzip_proxied"; then
        print_status "Fixing gzip_proxied configuration..."
        
        # Create fixed nginx config
        cat > nginx/nginx-fixed.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Basic Settings
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    # Simple and safe gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Upstream for Next.js app
    upstream jugiter_frontend {
        server jugiter-frontend:3000;
    }

    # HTTP server
    server {
        listen 80;
        server_name localhost;

        # Proxy settings
        location / {
            proxy_pass http://jugiter_frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 60s;
            proxy_connect_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
        print_success "Created fixed nginx configuration: nginx/nginx-fixed.conf"
    fi
fi

# Check for upstream connection errors
if grep -q "connect() failed" "$NGINX_ERROR_LOG"; then
    print_error "Upstream Connection Error Detected"
    print_status "Frontend container may not be running or accessible"
    
    echo "Solutions:"
    echo "1. Check if frontend container is running: docker compose ps"
    echo "2. Check frontend health: curl http://localhost:3000/api/health"
    echo "3. Restart frontend: docker compose restart jugiter-frontend"
fi

# Check for permission errors
if grep -q "permission denied" "$NGINX_ERROR_LOG"; then
    print_error "Permission Error Detected"
    echo "Solutions:"
    echo "1. Check file permissions: ls -la nginx/"
    echo "2. Fix permissions: sudo chown -R \$USER:docker nginx/"
fi

# Check for port binding errors
if grep -q "bind() failed" "$NGINX_ERROR_LOG"; then
    print_error "Port Binding Error Detected"
    echo "Solutions:"
    echo "1. Check what's using the port: netstat -tlnp | grep :80"
    echo "2. Stop conflicting service: sudo systemctl stop apache2"
    echo "3. Use different port in docker-compose.yml"
fi

# Check for SSL certificate errors
if grep -q "SSL_CTX_use_certificate" "$NGINX_ERROR_LOG"; then
    print_error "SSL Certificate Error Detected"
    echo "Solutions:"
    echo "1. Disable SSL sections in nginx.conf"
    echo "2. Generate self-signed certificates"
    echo "3. Use HTTP-only configuration"
fi

print_header "Recommended Actions"

# Create a solution script
cat > scripts/fix-nginx-errors.sh << 'EOF'
#!/bin/bash

# Automated Nginx Error Fix Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_status "Applying nginx fixes..."

# Backup current config
if [ -f "nginx/nginx.conf" ]; then
    cp nginx/nginx.conf nginx/nginx.conf.backup.$(date +%s)
    print_status "Backed up current nginx.conf"
fi

# Use fixed config if available
if [ -f "nginx/nginx-fixed.conf" ]; then
    cp nginx/nginx-fixed.conf nginx/nginx.conf
    print_success "Applied fixed nginx configuration"
fi

# Test the configuration
print_status "Testing nginx configuration..."
if docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t; then
    print_success "Nginx configuration is valid!"
    
    # Restart nginx container
    print_status "Restarting nginx container..."
    docker compose restart nginx
    
    sleep 5
    
    # Check if nginx is running
    if docker compose ps | grep nginx | grep -q "Up"; then
        print_success "Nginx is running successfully!"
    else
        print_error "Nginx failed to start, check logs: docker compose logs nginx"
    fi
else
    print_error "Nginx configuration is still invalid"
    
    # Restore backup if available
    LATEST_BACKUP=$(ls -t nginx/nginx.conf.backup.* 2>/dev/null | head -1)
    if [ ! -z "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" nginx/nginx.conf
        print_status "Restored backup configuration"
    fi
fi
EOF

chmod +x scripts/fix-nginx-errors.sh
print_success "Created automated fix script: scripts/fix-nginx-errors.sh"

print_header "Next Steps"
echo "1. Review the error analysis above"
echo "2. Run the fix script: ./scripts/fix-nginx-errors.sh"
echo "3. If issues persist, try emergency deployment: ./scripts/emergency-deploy.sh"
echo "4. Check logs again: docker compose logs nginx"

# Save analysis to file
{
    echo "Nginx Log Analysis - $(date)"
    echo "=================================="
    echo "Log file analyzed: $NGINX_ERROR_LOG"
    echo ""
    echo "Recent log entries:"
    tail -20 "$NGINX_ERROR_LOG"
} > nginx-analysis-$(date +%Y%m%d-%H%M%S).txt

print_success "Analysis saved to: nginx-analysis-$(date +%Y%m%d-%H%M%S).txt"