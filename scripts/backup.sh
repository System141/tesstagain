#!/bin/bash

# Backup script for Jugiter NFT Launchpad
# Creates backups of application data, configuration, and logs

set -e

# Configuration
BACKUP_DIR="/var/backups/jugiter"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        print_status "Creating backup directory: $BACKUP_DIR"
        sudo mkdir -p "$BACKUP_DIR"
        sudo chown $USER:$USER "$BACKUP_DIR"
    fi
}

# Function to backup application files
backup_application() {
    local backup_file="$BACKUP_DIR/jugiter_app_$TIMESTAMP.tar.gz"
    
    print_status "Creating application backup: $backup_file"
    
    cd "$PROJECT_DIR"
    tar -czf "$backup_file" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='.git' \
        --exclude='logs' \
        --exclude='cache' \
        --exclude='artifacts' \
        .
    
    print_success "Application backup created: $backup_file"
}

# Function to backup configuration files
backup_configuration() {
    local backup_file="$BACKUP_DIR/jugiter_config_$TIMESTAMP.tar.gz"
    
    print_status "Creating configuration backup: $backup_file"
    
    cd "$PROJECT_DIR"
    tar -czf "$backup_file" \
        .env* \
        docker-compose.yml \
        nginx/nginx.conf \
        scripts/ \
        hardhat.config.js \
        package*.json \
        frontend/package*.json \
        frontend/next.config.ts \
        frontend/tailwind.config.ts \
        frontend/tsconfig.json
    
    print_success "Configuration backup created: $backup_file"
}

# Function to backup logs
backup_logs() {
    local backup_file="$BACKUP_DIR/jugiter_logs_$TIMESTAMP.tar.gz"
    
    if [ -d "$PROJECT_DIR/logs" ] || [ -d "$PROJECT_DIR/nginx/logs" ]; then
        print_status "Creating logs backup: $backup_file"
        
        cd "$PROJECT_DIR"
        tar -czf "$backup_file" \
            logs/ \
            nginx/logs/ \
            2>/dev/null || true
        
        print_success "Logs backup created: $backup_file"
    else
        print_warning "No logs directory found, skipping logs backup"
    fi
}

# Function to backup Docker data
backup_docker_data() {
    local backup_file="$BACKUP_DIR/jugiter_docker_$TIMESTAMP.tar.gz"
    
    print_status "Creating Docker data backup: $backup_file"
    
    # Export Docker images
    docker save $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep jugiter | tr '\n' ' ') -o "$BACKUP_DIR/jugiter_images_$TIMESTAMP.tar" 2>/dev/null || true
    
    # Backup Docker volumes if any
    docker run --rm -v jugiter_data:/data -v "$BACKUP_DIR":/backup alpine tar -czf "/backup/jugiter_volumes_$TIMESTAMP.tar.gz" -C /data . 2>/dev/null || true
    
    print_success "Docker data backup completed"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "jugiter_*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    print_success "Old backups cleaned up"
}

# Function to list backups
list_backups() {
    print_status "Available backups:"
    ls -la "$BACKUP_DIR"/jugiter_* 2>/dev/null || print_warning "No backups found"
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will restore from backup and may overwrite current data!"
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    print_status "Stopping services..."
    docker compose down
    
    print_status "Restoring from backup: $backup_file"
    cd "$PROJECT_DIR"
    tar -xzf "$backup_file"
    
    print_status "Starting services..."
    docker compose up -d
    
    print_success "Restore completed"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --app           Backup application files only"
    echo "  --config        Backup configuration files only"
    echo "  --logs          Backup logs only"
    echo "  --docker        Backup Docker data only"
    echo "  --full          Full backup (default)"
    echo "  --list          List available backups"
    echo "  --restore FILE  Restore from backup file"
    echo "  --cleanup       Cleanup old backups"
    echo "  --help          Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BACKUP_DIR      Backup directory (default: /var/backups/jugiter)"
    echo "  RETENTION_DAYS  Backup retention in days (default: 30)"
}

# Main backup function
perform_full_backup() {
    create_backup_dir
    backup_application
    backup_configuration
    backup_logs
    backup_docker_data
    cleanup_old_backups
    
    print_success "Full backup completed successfully!"
    print_status "Backup location: $BACKUP_DIR"
}

# Parse command line arguments
case "${1:-}" in
    --app)
        create_backup_dir
        backup_application
        ;;
    --config)
        create_backup_dir
        backup_configuration
        ;;
    --logs)
        create_backup_dir
        backup_logs
        ;;
    --docker)
        create_backup_dir
        backup_docker_data
        ;;
    --list)
        list_backups
        ;;
    --restore)
        if [ -z "$2" ]; then
            print_error "Please specify backup file to restore"
            exit 1
        fi
        restore_backup "$2"
        ;;
    --cleanup)
        cleanup_old_backups
        ;;
    --help)
        show_help
        ;;
    --full|*)
        perform_full_backup
        ;;
esac