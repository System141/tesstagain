#!/bin/bash

# Docker-based contract deployment to avoid Node.js version issues
echo "🐳 Docker-based Smart Contract Deployment"
echo "========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with:"
    echo "SEPOLIA_RPC_URL=your_rpc_url"
    echo "PRIVATE_KEY=your_private_key"
    echo "ETHERSCAN_API_KEY=your_etherscan_key"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found!"
    echo "Please install Docker or use manual deployment"
    exit 1
fi

echo "📦 Creating temporary deployment container..."

# Create a temporary Dockerfile for deployment
cat > Dockerfile.deploy << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY hardhat.config.js ./
COPY .env ./

# Install dependencies
RUN npm install

# Copy contracts and scripts
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/

# Set executable permissions
RUN chmod +x scripts/*.js

CMD ["npm", "run", "deploy:marketplace"]
EOF

# Create deployment npm script
if ! grep -q "deploy:marketplace" package.json; then
    echo "📝 Adding deployment script to package.json..."
    # Create a temporary package.json with the deploy script
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['deploy:marketplace'] = 'hardhat run scripts/deploy-marketplace-legacy.js --network sepolia';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
fi

echo "🚀 Building deployment container..."
docker build -f Dockerfile.deploy -t marketplace-deployer .

echo "📡 Deploying marketplace contract..."
docker run --rm -v $(pwd)/.env:/app/.env marketplace-deployer

echo "🧹 Cleaning up..."
rm -f Dockerfile.deploy

echo "✅ Docker deployment completed!"
echo ""
echo "If deployment succeeded, the marketplace address was printed above."
echo "Add it to frontend/.env.local as:"
echo "NEXT_PUBLIC_MARKETPLACE_ADDRESS=<the_printed_address>"