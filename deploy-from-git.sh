#!/bin/bash

# Simple deployment script for VPS - pulls from git and redeploys
# Run this script on your VPS in the project directory

echo "🚀 Deploying latest changes from git..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin vpstest

# Run the git deployment script
echo "🔨 Running deployment..."
chmod +x scripts/git-deploy.sh
./scripts/git-deploy.sh

echo "✅ Deployment complete!"