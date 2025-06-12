// Manual marketplace deployment with user wallet
// This script guides the user through deploying the marketplace contract
const hre = require("hardhat");

async function main() {
  console.log("🚀 NFT Marketplace Deployment Guide");
  console.log("=" .repeat(50));
  console.log("");
  
  console.log("📋 Prerequisites:");
  console.log("1. ✅ You have a MetaMask wallet with Sepolia ETH");
  console.log("2. ✅ You have an RPC URL (Infura, Alchemy, or public)");
  console.log("3. ✅ You have your wallet's private key");
  console.log("");
  
  console.log("⚠️  SECURITY WARNING:");
  console.log("   Never share your private key or commit it to Git!");
  console.log("   Only use testnet wallets for development!");
  console.log("");
  
  console.log("🔧 Setup Instructions:");
  console.log("1. Get Sepolia ETH from: https://sepoliafaucet.com/");
  console.log("2. Get free RPC URL from:");
  console.log("   - Infura: https://infura.io/");
  console.log("   - Alchemy: https://alchemy.com/");
  console.log("   - Or use public: https://sepolia.drpc.org");
  console.log("");
  
  console.log("3. Update your .env file:");
  console.log("   SEPOLIA_RPC_URL=your_rpc_url_here");
  console.log("   PRIVATE_KEY=your_wallet_private_key_here");
  console.log("   ETHERSCAN_API_KEY=your_etherscan_key_here (optional)");
  console.log("");
  
  console.log("4. Run the deployment:");
  console.log("   npx hardhat run scripts/deploy-marketplace-legacy.js --network sepolia");
  console.log("");
  
  console.log("5. Copy the deployed address to frontend/.env.local:");
  console.log("   NEXT_PUBLIC_MARKETPLACE_ADDRESS=deployed_contract_address");
  console.log("");
  
  console.log("📍 Alternative: Deploy via Frontend");
  console.log("You can also deploy directly from your browser:");
  console.log("1. Go to: https://remix.ethereum.org/");
  console.log("2. Upload the NFTMarketplace.sol contract");
  console.log("3. Compile and deploy to Sepolia");
  console.log("4. Copy the deployed address to your .env.local");
  console.log("");
  
  console.log("💡 Quick Test Deployment:");
  console.log("If you want to test without real funds, you can:");
  console.log("1. Use a pre-deployed test marketplace address");
  console.log("2. Add this to frontend/.env.local:");
  console.log("   NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x1234567890123456789012345678901234567890");
  console.log("");
  
  console.log("🎉 Once deployed, your marketplace will support:");
  console.log("   ✅ NFT listing and trading");
  console.log("   ✅ Offer/buy functionality");
  console.log("   ✅ Platform fees and royalties");
  console.log("   ✅ Real-time marketplace data");
  console.log("");
  
  console.log("Need help? Check DEPLOYMENT.md for detailed instructions.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });