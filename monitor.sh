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
