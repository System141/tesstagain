// Ethers v6 compatible deployment script 
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFT Marketplace...");
  console.log("Network:", hre.network.name);

  try {
    // Get contract factory
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    
    console.log("📦 Deploying contract...");
    const marketplace = await NFTMarketplace.deploy();

    // Wait for deployment to finish
    console.log("⏳ Waiting for deployment transaction...");
    await marketplace.waitForDeployment();
    
    const address = await marketplace.getAddress();
    console.log("NFT Marketplace deployed to:", address);
    console.log("");
    console.log("=".repeat(60));
    console.log("IMPORTANT: Save this address!");
    console.log("Add this to your frontend/.env.local:");
    console.log("NEXT_PUBLIC_MARKETPLACE_ADDRESS=" + address);
    console.log("=".repeat(60));
    console.log("");
    
    // Verify on Etherscan if API key is available
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("Waiting for block confirmations before verification...");
      
      // Wait for 5 confirmations
      const deployTx = marketplace.deploymentTransaction();
      console.log("Transaction hash:", deployTx?.hash || 'N/A');
      
      // Wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      
      console.log("Attempting to verify contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan!");
      } catch (error) {
        console.log("⚠️  Verification failed (this is optional):");
        console.log("   ", error.message);
        console.log("   You can verify manually later on Etherscan");
      }
    } else {
      console.log("⚠️  No ETHERSCAN_API_KEY found - skipping verification");
      console.log("   Add ETHERSCAN_API_KEY to .env to enable auto-verification");
    }

    console.log("");
    console.log("🎉 Deployment completed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Add the marketplace address to frontend/.env.local");
    console.log("2. Deploy your frontend: ./scripts/deploy.sh");
    console.log("3. Test the marketplace functionality");

  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("");
      console.log("💡 Solution: Add Sepolia ETH to your wallet");
      console.log("   Get testnet ETH from: https://sepoliafaucet.com/");
    } else if (error.message.includes("invalid project id")) {
      console.log("");
      console.log("💡 Solution: Check your SEPOLIA_RPC_URL in .env");
      console.log("   Get RPC URL from: https://infura.io/ or https://alchemy.com/");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });