// Ethers v6 compatible marketplace deployment script
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFT Marketplace (Ethers v6 Compatible)...");
  console.log("Network:", hre.network.name);
  console.log("");

  try {
    // Get the contract factory
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    
    console.log("📦 Deploying contract...");
    
    // Deploy the contract
    const marketplace = await NFTMarketplace.deploy();
    
    console.log("⏳ Waiting for deployment transaction to be mined...");
    
    // Wait for the deployment transaction to be mined
    await marketplace.waitForDeployment();
    
    // Get the deployed contract address
    const address = await marketplace.getAddress();
    
    console.log("");
    console.log("✅ NFT Marketplace deployed successfully!");
    console.log("📍 Contract Address:", address);
    console.log("");
    
    // Get deployment transaction details
    const deployTx = marketplace.deploymentTransaction();
    if (deployTx) {
      console.log("🔗 Transaction Hash:", deployTx.hash);
      console.log("⛽ Gas Used:", deployTx.gasLimit?.toString() || 'N/A');
    }
    
    console.log("");
    console.log("=" .repeat(70));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=" .repeat(70));
    console.log("");
    console.log("📋 Next Steps:");
    console.log("1. Copy this address to your frontend/.env.local:");
    console.log("");
    console.log("   NEXT_PUBLIC_MARKETPLACE_ADDRESS=" + address);
    console.log("");
    console.log("2. Restart your frontend application:");
    console.log("   npm run dev  # or npm run build && npm start");
    console.log("");
    console.log("3. Test marketplace functionality:");
    console.log("   - Go to Marketplace tab");
    console.log("   - Create NFT listings");
    console.log("   - Test buy/offer features");
    console.log("");
    
    // Contract verification if Etherscan API key is available
    if (process.env.ETHERSCAN_API_KEY && process.env.ETHERSCAN_API_KEY !== 'dummy') {
      console.log("🔍 Starting contract verification...");
      console.log("⏳ Waiting for block confirmations...");
      
      // Wait for a few block confirmations
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      
      try {
        console.log("📝 Verifying contract on Etherscan...");
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan!");
        console.log("🔗 Verification URL: https://sepolia.etherscan.io/address/" + address);
      } catch (verificationError) {
        console.log("⚠️  Verification failed (this is optional):");
        console.log("   ", verificationError.message);
        console.log("   You can verify manually later on Etherscan");
      }
    } else {
      console.log("⚠️  No valid ETHERSCAN_API_KEY found - skipping verification");
      console.log("   Add ETHERSCAN_API_KEY to .env to enable auto-verification");
      console.log("   Get API key from: https://etherscan.io/apis");
    }

    console.log("");
    console.log("🌐 View contract on Etherscan:");
    console.log("   https://sepolia.etherscan.io/address/" + address);
    console.log("");
    console.log("🎯 Marketplace Features Now Available:");
    console.log("   ✅ NFT Listing & Trading");
    console.log("   ✅ Buy/Sell Functionality");
    console.log("   ✅ Offer System");
    console.log("   ✅ Platform Fees (2.5%)");
    console.log("   ✅ Royalty Support (EIP-2981)");
    console.log("");
    console.log("🚀 Your NFT marketplace is now fully functional!");

  } catch (error) {
    console.error("");
    console.error("❌ DEPLOYMENT FAILED:");
    console.error("=" .repeat(50));
    console.error(error.message);
    console.error("");
    
    // Provide helpful error messages
    if (error.message.includes("insufficient funds")) {
      console.log("💡 SOLUTION: Add Sepolia ETH to your wallet");
      console.log("   1. Go to: https://sepoliafaucet.com/");
      console.log("   2. Enter your wallet address");
      console.log("   3. Request test ETH");
      console.log("   4. Wait a few minutes and try again");
    } else if (error.message.includes("invalid project id") || error.message.includes("invalid API key")) {
      console.log("💡 SOLUTION: Check your RPC URL in .env file");
      console.log("   SEPOLIA_RPC_URL should be a valid RPC endpoint:");
      console.log("   - Infura: https://sepolia.infura.io/v3/YOUR_PROJECT_ID");
      console.log("   - Alchemy: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY");
      console.log("   - Public: https://sepolia.drpc.org");
    } else if (error.message.includes("nonce")) {
      console.log("💡 SOLUTION: Reset your MetaMask account");
      console.log("   Settings → Advanced → Reset Account");
    } else if (error.message.includes("gas")) {
      console.log("💡 SOLUTION: Gas estimation failed");
      console.log("   Try again or increase gas limit in hardhat.config.js");
    } else if (error.message.includes("private key")) {
      console.log("💡 SOLUTION: Check your private key in .env file");
      console.log("   - Should start with 0x");
      console.log("   - Should be 64 characters after 0x");
      console.log("   - Use only test wallet private keys!");
    }
    
    console.log("");
    console.log("🆘 Need Help?");
    console.log("   - Check MARKETPLACE_DEPLOYMENT.md for detailed instructions");
    console.log("   - Try alternative deployment methods (Remix IDE)");
    console.log("   - Verify your .env configuration");
    console.log("");
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });