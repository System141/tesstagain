# 🚀 VPS Deployment Guide - Jugiter NFT Launchpad

Complete guide for deploying the redesigned clean UI to a remote VPS via SSH.

## 📋 Prerequisites

- Remote VPS with Ubuntu 20.04+ (recommended)
- SSH access to your VPS
- Pinata API credentials for IPFS uploads
- Domain name (optional, for SSL)

## 🛠️ Quick Deployment

### Method 1: Automated Upload + Deploy

1. **Upload files to VPS:**
```bash
# Make upload script executable
chmod +x scripts/vps-upload.sh

# Upload to your VPS (replace with your VPS IP)
./scripts/vps-upload.sh YOUR_VPS_IP root
```

2. **SSH to your VPS:**
```bash
ssh root@YOUR_VPS_IP
```

3. **Prepare files on VPS:**
```bash
# Create project directory
mkdir -p /root/tesstagain
cd /root/tesstagain

# Move uploaded files
mv /tmp/* . 2>/dev/null || true
```

4. **Deploy the application:**
```bash
# Make deploy script executable
chmod +x scripts/vps-deploy.sh

# Run deployment (replace with your Pinata credentials)
./scripts/vps-deploy.sh YOUR_PINATA_API_KEY YOUR_PINATA_SECRET_KEY
```

### Method 2: Manual Upload

1. **Archive and upload:**
```bash
# Create archive (run from project root)
tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czf tesstagain.tar.gz .

# Upload to VPS
scp tesstagain.tar.gz root@YOUR_VPS_IP:/root/

# SSH and extract
ssh root@YOUR_VPS_IP
cd /root
tar -xzf tesstagain.tar.gz
mv tesstagain-extracted tesstagain  # if needed
```

2. **Deploy:**
```bash
cd /root/tesstagain
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh YOUR_PINATA_API_KEY YOUR_PINATA_SECRET_KEY
```

## 🔧 What the Deployment Script Does

### System Setup:
- ✅ Updates Ubuntu packages
- ✅ Installs Docker & Docker Compose
- ✅ Installs Nginx, Node.js, and security tools
- ✅ Creates dedicated service user (`jugiter`)
- ✅ Configures UFW firewall

### Application Setup:
- ✅ Sets up application directory (`/opt/tesstagain`)
- ✅ Configures environment variables with Pinata API keys
- ✅ Builds Docker containers with clean UI
- ✅ Creates systemd service for auto-start

### Web Server Setup:
- ✅ Configures Nginx reverse proxy
- ✅ Optimizes for large JavaScript chunks
- ✅ Sets up security headers
- ✅ Enables gzip compression
- ✅ Configures health checks

## 🌐 Access Your Application

After successful deployment:

- **Direct access**: `http://YOUR_VPS_IP:3000`
- **Nginx proxy**: `http://YOUR_VPS_IP` (port 80)
- **Health check**: `http://YOUR_VPS_IP/api/health`

## 🔒 SSL Setup (Optional)

If you have a domain name:

1. **Point your domain to the VPS IP**
2. **Install SSL certificate:**
```bash
# On your VPS
certbot --nginx -d yourdomain.com
```

## 📊 Management Commands

```bash
# Check application status
systemctl status jugiter

# Start/stop/restart
systemctl start jugiter
systemctl stop jugiter
systemctl restart jugiter

# View logs
cd /opt/tesstagain
docker-compose logs -f

# Check containers
docker-compose ps

# Update application
docker-compose pull
docker-compose up -d --build
```

## 🔥 Firewall Ports

The deployment automatically opens:
- **Port 22**: SSH access
- **Port 80**: HTTP access (Nginx)
- **Port 443**: HTTPS access (SSL)
- **Port 3000**: Direct app access (optional)
- **Port 8080**: Alternative proxy port

## 🚨 Troubleshooting

### Application won't start:
```bash
# Check Docker status
systemctl status docker

# Check container logs
cd /opt/tesstagain
docker-compose logs

# Restart everything
systemctl restart docker
systemctl restart jugiter
```

### Nginx issues:
```bash
# Test Nginx config
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx
```

### Health check fails:
```bash
# Check if app is responding
curl http://localhost:3000/api/health

# Check container status
docker-compose ps

# View application logs
docker-compose logs frontend
```

## 🎯 Deployed Features

Your VPS will have:

### ✨ **Clean UI Design**
- Minimal "Jugiter" branding
- Simplified navigation (Collections/Create)
- Clean collection cards
- Reduced visual clutter

### 🔧 **Full NFT Functionality**
- NFT collection creation
- Minting with allowlists
- IPFS metadata storage via Pinata
- Ethereum Sepolia integration

### 🌐 **Production Ready**
- Docker containerization
- Nginx reverse proxy
- Security headers
- Gzip compression
- Auto-start on boot

### 📱 **Performance Optimized**
- Static asset caching
- Large file handling
- Optimized JavaScript delivery
- Health monitoring

## 🔑 Environment Variables

The deployment creates `/opt/tesstagain/frontend/.env.local`:

```env
NEXT_PUBLIC_PINATA_API_KEY=your_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_here
NODE_ENV=production
```

## 📋 Post-Deployment Checklist

- [ ] Application accessible via browser
- [ ] Health endpoint returns 200 OK
- [ ] Wallet connection works
- [ ] NFT collection creation functional
- [ ] Image uploads to Pinata working
- [ ] Firewall properly configured
- [ ] SSL certificate installed (if domain used)
- [ ] Backup strategy in place

## 🆘 Support

If you encounter issues:

1. Check the deployment logs during installation
2. Verify Pinata API credentials are correct
3. Ensure VPS has sufficient resources (2GB+ RAM recommended)
4. Check that all required ports are open
5. Review Docker and Nginx logs for errors

Your clean, redesigned Jugiter NFT Launchpad should now be live on your VPS! 🎉