#!/bin/bash

# Quick fix script for NFT image loading issues

echo "🔧 Fixing NFT Image Loading Issues..."

# Build the application with fixes
echo "📦 Building application with fixes..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to VPS if in production
    if [ "$1" = "deploy" ]; then
        echo "🚀 Deploying fixes to VPS..."
        cd ..
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        
        echo "✅ Deployment completed!"
        echo "🌐 Your NFT images should now load correctly"
        echo "📝 Changes made:"
        echo "  - Fixed token existence checking"
        echo "  - Improved IPFS gateway handling"
        echo "  - Added fallback mechanisms for image loading"
        echo "  - Better error handling for non-existent tokens"
    else
        echo "✅ Build completed! Run './scripts/fix-nft-issues.sh deploy' to deploy to VPS"
    fi
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi