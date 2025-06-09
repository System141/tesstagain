#!/bin/bash

# Health check script for Jugiter NFT Launchpad
# This script checks the health of the application and its services

set -e

# Configuration
HEALTH_CHECK_URL="http://localhost:3000"
LOG_FILE="/var/log/jugiter-health.log"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to send Telegram notification
send_telegram_notification() {
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        local message="🚨 Jugiter Alert: $1"
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d chat_id="$TELEGRAM_CHAT_ID" \
            -d text="$message" > /dev/null
    fi
}

# Function to check service health
check_service_health() {
    local service_name="$1"
    local container_name="$2"
    
    if docker ps --filter "name=$container_name" --filter "status=running" --format "table {{.Names}}" | grep -q "$container_name"; then
        log_message "✅ $service_name is running"
        return 0
    else
        log_message "❌ $service_name is not running"
        send_telegram_notification "$service_name is not running"
        return 1
    fi
}

# Function to check application response
check_application_response() {
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        log_message "✅ Application is responding (HTTP $response_code)"
        return 0
    else
        log_message "❌ Application is not responding (HTTP $response_code)"
        send_telegram_notification "Application is not responding (HTTP $response_code)"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local threshold=85
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        log_message "✅ Disk usage: ${usage}% (threshold: ${threshold}%)"
        return 0
    else
        log_message "⚠️ High disk usage: ${usage}% (threshold: ${threshold}%)"
        send_telegram_notification "High disk usage: ${usage}%"
        return 1
    fi
}

# Function to check memory usage
check_memory_usage() {
    local threshold=85
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt "$threshold" ]; then
        log_message "✅ Memory usage: ${usage}% (threshold: ${threshold}%)"
        return 0
    else
        log_message "⚠️ High memory usage: ${usage}% (threshold: ${threshold}%)"
        send_telegram_notification "High memory usage: ${usage}%"
        return 1
    fi
}

# Function to check Docker daemon
check_docker_daemon() {
    if docker info > /dev/null 2>&1; then
        log_message "✅ Docker daemon is running"
        return 0
    else
        log_message "❌ Docker daemon is not running"
        send_telegram_notification "Docker daemon is not running"
        return 1
    fi
}

# Function to restart service if needed
restart_service_if_needed() {
    local service_name="$1"
    local container_name="$2"
    
    if ! check_service_health "$service_name" "$container_name"; then
        log_message "🔄 Attempting to restart $service_name..."
        docker compose restart "$container_name" || {
            log_message "❌ Failed to restart $service_name"
            send_telegram_notification "Failed to restart $service_name"
            return 1
        }
        sleep 10
        if check_service_health "$service_name" "$container_name"; then
            log_message "✅ Successfully restarted $service_name"
            send_telegram_notification "$service_name has been restarted and is now running"
        else
            log_message "❌ $service_name still not running after restart"
            send_telegram_notification "$service_name is still not running after restart attempt"
            return 1
        fi
    fi
}

# Main health check function
main_health_check() {
    log_message "🔍 Starting health check..."
    
    local overall_status=0
    
    # Check Docker daemon
    check_docker_daemon || overall_status=1
    
    # Check individual services
    restart_service_if_needed "Frontend" "jugiter-frontend" || overall_status=1
    restart_service_if_needed "Nginx" "jugiter-nginx" || overall_status=1
    
    # Check application response
    sleep 5  # Wait a bit for services to fully start
    check_application_response || overall_status=1
    
    # Check system resources
    check_disk_space || overall_status=1
    check_memory_usage || overall_status=1
    
    if [ $overall_status -eq 0 ]; then
        log_message "✅ All health checks passed"
    else
        log_message "❌ Some health checks failed"
    fi
    
    log_message "🏁 Health check completed"
    return $overall_status
}

# Function to display help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --check-only    Run health checks without auto-restart"
    echo "  --restart-all   Restart all services"
    echo "  --status        Show current service status"
    echo "  --help          Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  TELEGRAM_BOT_TOKEN    Telegram bot token for notifications"
    echo "  TELEGRAM_CHAT_ID      Telegram chat ID for notifications"
}

# Parse command line arguments
case "${1:-}" in
    --check-only)
        log_message "🔍 Running health checks only (no auto-restart)..."
        check_docker_daemon
        check_service_health "Frontend" "jugiter-frontend"
        check_service_health "Nginx" "jugiter-nginx"
        check_application_response
        check_disk_space
        check_memory_usage
        ;;
    --restart-all)
        log_message "🔄 Restarting all services..."
        docker compose restart
        sleep 10
        main_health_check
        ;;
    --status)
        echo "Service Status:"
        docker compose ps
        echo ""
        echo "System Resources:"
        echo "Disk Usage: $(df / | awk 'NR==2 {print $5}')"
        echo "Memory Usage: $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
        ;;
    --help)
        show_help
        ;;
    *)
        main_health_check
        ;;
esac