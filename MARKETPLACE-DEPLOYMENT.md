# 🎨 NFT Marketplace Deployment Guide

Complete guide for deploying the **Jugiter NFT Marketplace** to a remote VPS. This version includes full marketplace functionality with image uploads and NFT trading capabilities.

## 🆕 What's New in Marketplace Version

### ✨ **Enhanced Features:**
- **🖼️ Individual NFT Minting**: Upload images and mint single NFTs with custom metadata
- **🛒 NFT Marketplace**: Browse, buy, and sell NFTs from all collections
- **📤 Image Upload System**: Direct integration with Pinata for IPFS storage
- **🎯 Collection Management**: Create collections AND mint individual NFTs
- **💱 Trading Interface**: List NFTs for sale and browse marketplace

### 🔧 **Technical Improvements:**
- Pinata IPFS integration for image and metadata storage
- Enhanced API endpoints for file uploads
- Marketplace browsing and filtering
- Individual NFT minting workflow
- Clean, minimal UI design

## 🚀 Quick VPS Deployment

### **Method 1: Automated Deployment**

1. **Upload to VPS:**
```bash
# From your local project directory
./scripts/vps-upload.sh YOUR_VPS_IP root
```

2. **Deploy on VPS:**
```bash
# SSH to your VPS
ssh root@YOUR_VPS_IP

# Set up project
mkdir -p /root/tesstagain && cd /root/tesstagain
mv /tmp/* . 2>/dev/null || true

# Deploy with Pinata credentials
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh YOUR_PINATA_API_KEY YOUR_PINATA_SECRET_KEY
```

### **Method 2: Manual Upload**

```bash
# Create and upload archive
tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czf tesstagain-marketplace.tar.gz .
scp tesstagain-marketplace.tar.gz root@YOUR_VPS_IP:/root/

# Extract and deploy on VPS
ssh root@YOUR_VPS_IP
cd /root && tar -xzf tesstagain-marketplace.tar.gz
cd tesstagain
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh YOUR_PINATA_API_KEY YOUR_PINATA_SECRET_KEY
```

## 🎨 Marketplace Features

### **For Users:**
- **🖼️ Upload & Mint**: Upload images directly and mint them as NFTs
- **🛒 Browse Marketplace**: Discover NFTs from all collections
- **💰 Buy & Sell**: Trade NFTs with other users
- **📊 Collection Analytics**: View collection stats and activity
- **🔍 Search & Filter**: Find specific NFTs and collections

### **For Creators:**
- **🎨 Create Collections**: Deploy new NFT collections
- **📤 Bulk Uploads**: Mint multiple NFTs with image uploads
- **💎 Custom Metadata**: Add attributes and descriptions
- **💰 Set Royalties**: Earn from secondary sales
- **📈 Track Performance**: Monitor collection metrics

## 🔑 Required Environment Variables

```bash
# Pinata IPFS Configuration (REQUIRED)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key

# Production Environment
NODE_ENV=production
```

## 🌐 API Endpoints

The marketplace includes these new endpoints:

- **`/api/pinata-upload`** - Upload images to IPFS via Pinata
- **`/api/pinata-metadata`** - Upload NFT metadata to IPFS
- **`/api/health`** - Application health check
- **`/api/ipfs`** - IPFS content proxy
- **`/api/image-proxy`** - Image optimization proxy

## 📋 Post-Deployment Checklist

- [ ] **Server accessible** via browser
- [ ] **Marketplace tab** loads and displays properly
- [ ] **Image upload** works in NFT minter
- [ ] **Collection creation** functional
- [ ] **Wallet connection** works with MetaMask
- [ ] **Pinata integration** operational
- [ ] **IPFS uploads** successful
- [ ] **Health endpoint** returns 200 OK

## 🧪 Testing Your Marketplace

### **1. Create a Test Collection:**
```
1. Go to "Create" tab
2. Fill in collection details
3. Set mint price (e.g., 0.001 ETH)
4. Enable allowlist (optional)
5. Deploy collection
```

### **2. Mint Individual NFTs:**
```
1. Go to "Marketplace" tab
2. Select your collection
3. Click "Mint NFT"
4. Upload an image (JPG, PNG, GIF, SVG)
5. Add name, description, and attributes
6. Mint NFT
```

### **3. Test Marketplace Features:**
```
1. Browse collections in marketplace
2. View individual NFTs
3. Test filtering (For Sale, My NFTs)
4. Test listing NFTs for sale
5. Test buying NFTs (demo functionality)
```

## 🔧 System Requirements

### **Minimum VPS Specs:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+
- **Network**: Public IP address

### **Recommended Specs:**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 40GB SSD
- **Bandwidth**: Unlimited or high quota

## 🚨 Troubleshooting

### **Image Upload Fails:**
```bash
# Check Pinata credentials
cat /opt/tesstagain/frontend/.env.local

# Test Pinata API
curl -X GET "https://api.pinata.cloud/data/testAuthentication" \
  -H "pinata_api_key: YOUR_API_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET_KEY"
```

### **Marketplace Not Loading:**
```bash
# Check container logs
cd /opt/tesstagain
docker-compose logs frontend

# Restart application
systemctl restart jugiter
```

### **NFT Images Not Displaying:**
```bash
# Test IPFS gateways
curl -I https://gateway.pinata.cloud/ipfs/QmYourHash
curl -I https://ipfs.io/ipfs/QmYourHash

# Check image proxy
curl http://localhost:3000/api/image-proxy?url=test
```

## 🔐 Security Considerations

- **🔑 API Keys**: Store Pinata credentials securely
- **🛡️ Firewall**: Only open necessary ports (80, 443, 22)
- **🔒 SSL**: Use Let's Encrypt for HTTPS
- **💰 Testnet**: Deploy on Sepolia testnet first
- **🧪 Testing**: Thoroughly test all functions before mainnet

## 📊 Performance Optimization

### **Image Optimization:**
- Automatically resize uploaded images
- Convert to optimal formats
- Implement lazy loading
- Use CDN for faster delivery

### **IPFS Performance:**
- Multiple gateway fallbacks
- Pin important content
- Monitor gateway response times
- Cache frequently accessed metadata

## 🎯 Access URLs After Deployment

- **Main Application**: `http://YOUR_VPS_IP`
- **Marketplace**: `http://YOUR_VPS_IP` (Marketplace tab)
- **Health Check**: `http://YOUR_VPS_IP/api/health`
- **Direct Port**: `http://YOUR_VPS_IP:3000`

## 🔄 Updates and Maintenance

```bash
# Update application
cd /opt/tesstagain
git pull  # if using git
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f

# Backup data
./scripts/backup.sh --full
```

## 🎉 Success Indicators

Your marketplace deployment is successful when:

✅ **Homepage loads** with clean UI and marketplace tab  
✅ **Collections display** in marketplace overview  
✅ **Image upload works** in NFT minter  
✅ **Wallet connects** via MetaMask  
✅ **NFT minting completes** with IPFS metadata  
✅ **Marketplace browsing** shows minted NFTs  
✅ **All API endpoints** return proper responses  

## 🆘 Support

If you encounter issues:

1. **Check deployment logs** during installation
2. **Verify Pinata API keys** are correct and active
3. **Test IPFS connectivity** from your server
4. **Ensure sufficient storage** for image uploads
5. **Monitor container resource usage**

Your **Jugiter NFT Marketplace** is now ready for users to upload images, mint NFTs, and trade digital assets! 🚀