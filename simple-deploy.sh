#!/bin/bash

# Simple deployment script for environments without Docker
echo "🚀 Simple Deployment for Jugiter NFT Marketplace"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from the tesstagain project directory"
    exit 1
fi

# Function to find available port
find_available_port() {
    local port=3000
    while ss -tuln | grep -q ":$port "; do
        port=$((port + 1))
    done
    echo $port
}

# Check Node.js version
echo "📋 Checking Node.js compatibility..."
node scripts/check-node-version.js
if [ $? -ne 0 ]; then
    echo "❌ Node.js version incompatible. Please upgrade to Node.js 18+ or use alternative deployment."
    exit 1
fi

# Navigate to frontend directory
echo "📁 Navigating to frontend directory..."
cd frontend

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local template..."
    cat > .env.local << 'EOF'
# Add your Pinata credentials
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key

# Add marketplace address after contract deployment
# NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
EOF
    echo "📝 Please edit frontend/.env.local with your actual values"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building the application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

# Find available port
AVAILABLE_PORT=$(find_available_port)
echo "🌐 Starting application on port $AVAILABLE_PORT..."

# Check if port 80 is in use and suggest alternatives
if ss -tuln | grep -q ":80 "; then
    echo "⚠️  Port 80 is in use by another service."
    echo "    Your app will run on port $AVAILABLE_PORT instead."
    echo "    Access your app at: http://localhost:$AVAILABLE_PORT"
else
    echo "✅ Port 80 is available."
    echo "    Access your app at: http://localhost:$AVAILABLE_PORT"
fi

# Start the application
echo "🚀 Starting the Jugiter NFT Marketplace..."
echo ""
echo "=================================================================="
echo "🎉 Jugiter NFT Marketplace is starting!"
echo "=================================================================="
echo "📱 Frontend URL: http://localhost:$AVAILABLE_PORT"
echo "🔗 Network: Ethereum Sepolia Testnet"
echo "💼 Features Available:"
echo "   ✅ NFT Collection Creation"
echo "   ✅ Real-time Marketplace Data"
echo "   ✅ User Profiles with Wallet Authentication"
echo "   ✅ Buy/Sell/Offer System (requires marketplace contract)"
echo ""
echo "📋 Next Steps:"
echo "1. Connect your MetaMask wallet"
echo "2. Switch to Sepolia testnet"
echo "3. Get testnet ETH from https://sepoliafaucet.com/"
echo "4. Create your first NFT collection!"
echo ""
echo "🔧 To deploy marketplace contract:"
echo "   node ../scripts/check-node-version.js"
echo "   npx hardhat run ../scripts/deploy-marketplace-legacy.js --network sepolia"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================================="

# Set port and start
PORT=$AVAILABLE_PORT npm start