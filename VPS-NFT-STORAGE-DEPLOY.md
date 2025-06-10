# VPS NFT.Storage Deployment Guide

## Quick Deployment on VPS

### Prerequisites
1. NFT.Storage API key from https://nft.storage (free)
2. VPS with Docker and Docker Compose installed
3. This repository cloned on your VPS

### Method 1: Quick Deploy Script
```bash
# On your VPS, run:
cd /path/to/tesstagain
git pull origin vpstest

# Deploy with your NFT.Storage API key
NFT_STORAGE_KEY="your_nft_storage_key_here" ./scripts/deploy-nft-storage.sh
```

### Method 2: Manual Deployment
```bash
# 1. Set your NFT.Storage API key
export NEXT_PUBLIC_NFT_STORAGE_KEY="your_nft_storage_key_here"

# 2. Stop existing containers
docker compose down

# 3. Build with NFT.Storage
docker compose build --no-cache

# 4. Start services
docker compose up -d

# 5. Check status
docker compose ps
docker compose logs -f
```

### Method 3: Environment File
```bash
# 1. Create/update .env file
echo "NEXT_PUBLIC_NFT_STORAGE_KEY=your_key_here" > .env

# 2. Deploy
docker compose --env-file .env up -d --build
```

## Verification

After deployment, your application will:
- Use NFT.Storage instead of Pinata for IPFS uploads
- Have unlimited free storage for NFTs
- Benefit from permanent Filecoin pinning

## Troubleshooting

### Check logs
```bash
docker compose logs -f jugiter-frontend
```

### Restart services
```bash
docker compose restart
```

### Check environment variables
```bash
docker compose exec jugiter-frontend env | grep NFT_STORAGE
```

## Benefits of NFT.Storage

✅ **Completely free** for NFT storage  
✅ **No rate limits** unlike Pinata free tier  
✅ **Permanent storage** via Filecoin network  
✅ **Built for NFTs** with proper metadata handling  
✅ **Reliable infrastructure** backed by Protocol Labs  

## Support

If you encounter issues:
1. Check the logs: `docker compose logs`
2. Verify your API key is valid
3. Ensure you have internet connectivity
4. Make sure Docker has enough resources