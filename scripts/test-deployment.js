// Test deployment script to verify contract compilation and basic functionality
const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Deployment Setup...");

  try {
    // Test 1: Verify contract compilation
    console.log("1. Testing contract compilation...");
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    const NFTCollectionFactory = await hre.ethers.getContractFactory("NFTCollectionFactory");
    console.log("✅ Smart contracts compile successfully");

    // Test 2: Check environment setup
    console.log("2. Checking environment configuration...");
    const hasRpcUrl = !!process.env.SEPOLIA_RPC_URL;
    const hasPrivateKey = !!process.env.PRIVATE_KEY;
    const hasEtherscanKey = !!process.env.ETHERSCAN_API_KEY;
    
    console.log(`   RPC URL configured: ${hasRpcUrl ? '✅' : '❌'}`);
    console.log(`   Private key configured: ${hasPrivateKey ? '✅' : '❌'}`);
    console.log(`   Etherscan API key configured: ${hasEtherscanKey ? '✅' : '❌'}`);

    if (!hasRpcUrl || !hasPrivateKey) {
      console.log("\n⚠️  To deploy contracts, you need to:");
      console.log("   1. Copy .env.example to .env");
      console.log("   2. Add your Sepolia RPC URL (from Infura/Alchemy)");
      console.log("   3. Add your wallet private key");
      console.log("   4. Add your Etherscan API key (optional, for verification)");
    }

    // Test 3: Estimate deployment costs
    if (hasRpcUrl && hasPrivateKey) {
      console.log("3. Estimating deployment costs...");
      try {
        const marketplaceDeployTx = await NFTMarketplace.getDeployTransaction();
        const estimatedGas = await hre.ethers.provider.estimateGas(marketplaceDeployTx);
        const gasPrice = await hre.ethers.provider.getGasPrice();
        const estimatedCost = estimatedGas * gasPrice;
        
        console.log(`   Estimated gas: ${estimatedGas.toString()}`);
        console.log(`   Estimated cost: ${hre.ethers.formatEther(estimatedCost)} ETH`);
        console.log("✅ Ready for deployment");
      } catch (error) {
        console.log("❌ Cannot connect to network. Check your RPC URL.");
      }
    }

    console.log("\n🎉 Deployment test completed!");
    console.log("\nNext steps:");
    console.log("1. Configure your .env file with real values");
    console.log("2. Run: npx hardhat run scripts/deploy-marketplace.js --network sepolia");
    console.log("3. Update frontend/.env.local with the marketplace address");
    console.log("4. Deploy to VPS with: ./scripts/deploy.sh");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });