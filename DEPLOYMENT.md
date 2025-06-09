# Jugiter NFT Launchpad - VPS Deployment Guide

This guide provides step-by-step instructions for deploying the Jugiter NFT Launchpad on a VPS server.

## Prerequisites

- **VPS Server**: Ubuntu 20.04+ or similar Linux distribution
- **Domain Name**: (Optional) For production deployment with SSL
- **Minimum Requirements**:
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage
  - Public IP address

## Quick Start Deployment

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl wget unzip
```

### 2. Clone Repository

```bash
# Clone the project
git clone <your-repository-url>
cd tesstagain

# Make scripts executable
chmod +x scripts/*.sh
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Edit environment files with your actual values
nano .env
nano frontend/.env.local
```

**Required Environment Variables:**

```bash
# .env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# frontend/.env.local
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here
```

### 4. Automated Deployment

```bash
# Run the deployment script
./scripts/deploy.sh
```

The script will:
- Install Docker and Docker Compose
- Set up SSL certificates (if domain provided)
- Build and start the application
- Configure monitoring

### 5. Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Log out and back in, then:
docker compose up -d --build
```

## Configuration Options

### Domain and SSL Setup

For production deployment with a custom domain:

```bash
# Set environment variables before deployment
export DOMAIN=yourdomain.com
export EMAIL=your-email@example.com

# Run deployment script
./scripts/deploy.sh
```

### Environment-Specific Configurations

#### Development
```bash
# Use localhost configuration
DOMAIN=localhost ./scripts/deploy.sh
```

#### Staging
```bash
# Use staging domain
DOMAIN=staging.yourdomain.com ./scripts/deploy.sh
```

#### Production
```bash
# Use production domain with monitoring
DOMAIN=yourdomain.com ENABLE_MONITORING=true ./scripts/deploy.sh
```

## Service Management

### Docker Compose Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f jugiter-frontend
docker compose logs -f jugiter-nginx

# Check service status
docker compose ps
```

### Health Checks

```bash
# Manual health check
./scripts/health-check.sh

# Check only (no auto-restart)
./scripts/health-check.sh --check-only

# View service status
./scripts/health-check.sh --status

# Restart all services
./scripts/health-check.sh --restart-all
```

### Monitoring Setup

The deployment includes automated monitoring that:
- Checks service health every 5 minutes
- Monitors disk and memory usage
- Automatically restarts failed services
- Sends Telegram notifications (optional)

#### Telegram Notifications Setup

```bash
# Set environment variables for notifications
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id

# Add to crontab for persistent monitoring
crontab -e

# Add this line:
*/5 * * * * /path/to/jugiter/scripts/health-check.sh
```

## Backup and Recovery

### Automated Backups

```bash
# Full backup
./scripts/backup.sh

# Backup specific components
./scripts/backup.sh --app      # Application files
./scripts/backup.sh --config   # Configuration files
./scripts/backup.sh --logs     # Log files
./scripts/backup.sh --docker   # Docker data
```

### Scheduled Backups

```bash
# Add to crontab for daily backups
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /path/to/jugiter/scripts/backup.sh --full
```

### Restore from Backup

```bash
# List available backups
./scripts/backup.sh --list

# Restore from specific backup
./scripts/backup.sh --restore /var/backups/jugiter/jugiter_app_20240101_020000.tar.gz
```

## Performance Optimization

### Nginx Configuration

The included Nginx configuration provides:
- Gzip compression
- Static file caching
- Rate limiting
- Security headers
- SSL/TLS configuration

### Resource Monitoring

```bash
# Check resource usage
docker stats

# Check disk usage
df -h

# Check memory usage
free -h

# Check network usage
iftop
```

## Security Considerations

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

### SSL Certificate Renewal

```bash
# Automatic renewal with certbot
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
0 12 * * * /usr/bin/certbot renew --quiet
```

### Environment Security

- Store sensitive data in environment files
- Never commit `.env` files to version control
- Use strong passwords and keys
- Regularly update system packages
- Monitor access logs

## Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
docker compose logs

# Check system resources
docker system df
free -h
df -h

# Restart services
docker compose restart
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Check Nginx configuration
nginx -t
```

#### Network Issues
```bash
# Check port availability
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Check Docker networks
docker network ls
docker network inspect jugiter_jugiter-network
```

### Log Locations

- Application logs: `./logs/`
- Nginx logs: `./nginx/logs/`
- System logs: `/var/log/`
- Health check logs: `/var/log/jugiter-health.log`
- Backup logs: `/var/log/jugiter-backup.log`

### Performance Issues

```bash
# Check resource usage
docker stats
htop

# Optimize Docker
docker system prune -f

# Check application performance
curl -w "@%{time_total}" http://localhost:3000
```

## Updating the Application

### Standard Update Process

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build

# Verify deployment
./scripts/health-check.sh
```

### Zero-Downtime Update

```bash
# Build new image
docker compose build

# Update services one by one
docker compose up -d --no-deps jugiter-frontend
docker compose up -d --no-deps jugiter-nginx
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Daily**: Check service status and logs
2. **Weekly**: Review resource usage and performance
3. **Monthly**: Update system packages and certificates
4. **Quarterly**: Full backup and disaster recovery test

### Monitoring Metrics

- Service uptime
- Response times
- Error rates
- Resource utilization
- SSL certificate expiry
- Disk space usage

### Contact and Support

For deployment issues or questions:
- Check logs first: `docker compose logs`
- Run health checks: `./scripts/health-check.sh`
- Review this guide for troubleshooting steps
- Check the project repository for updates

## Architecture Overview

```
Internet → Nginx (Port 80/443) → Next.js App (Port 3000)
                ↓
        Load Balancing & SSL
                ↓
        Static File Serving
                ↓
        API Rate Limiting
```

The deployment creates a robust, production-ready environment with proper security, monitoring, and backup capabilities.