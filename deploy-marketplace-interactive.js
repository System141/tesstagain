// Interactive Marketplace Deployment Script
const hre = require("hardhat");
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("🚀 NFT Marketplace Interactive Deployment");
  console.log("=" .repeat(50));
  
  // Mevcut .env değerlerini göster
  console.log("\n📋 Current Configuration:");
  console.log("RPC URL:", process.env.SEPOLIA_RPC_URL || "Not set");
  console.log("Private Key:", process.env.PRIVATE_KEY ? "Set (hidden)" : "Not set");
  console.log("");
  
  // Deployment seçenekleri
  console.log("🔧 Deployment Options:");
  console.log("1. Use existing .env configuration");
  console.log("2. Deploy to local Hardhat network (for testing)");
  console.log("3. Setup new configuration");
  console.log("4. Exit");
  
  const choice = await question("\nSelect option (1-4): ");
  
  if (choice === "4") {
    console.log("Exiting...");
    process.exit(0);
  }
  
  if (choice === "3") {
    console.log("\n⚠️  Configuration Setup");
    console.log("Please update your .env file with:");
    console.log("- SEPOLIA_RPC_URL (from Infura/Alchemy or use https://sepolia.drpc.org)");
    console.log("- PRIVATE_KEY (from MetaMask - USE ONLY TEST WALLET!)");
    console.log("\nThen run this script again.");
    process.exit(0);
  }
  
  let network = "sepolia";
  if (choice === "2") {
    network = "hardhat";
    console.log("\n🏠 Deploying to local Hardhat network...");
  }
  
  try {
    // Deploy contract
    console.log("\n📦 Deploying NFT Marketplace...");
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
    
    if (network === "sepolia" && balance === 0n) {
      console.error("\n❌ No ETH in account!");
      console.log("Get free Sepolia ETH from:");
      console.log("- https://sepoliafaucet.com/");
      console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
      process.exit(1);
    }
    
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy();
    
    console.log("⏳ Waiting for deployment...");
    await marketplace.waitForDeployment();
    
    const address = await marketplace.getAddress();
    console.log("✅ Marketplace deployed to:", address);
    
    // Save deployment info
    const deploymentInfo = {
      network: network,
      address: address,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address
    };
    
    fs.writeFileSync(
      'marketplace-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    // Update instructions
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📋 Next Steps:");
    console.log("\n1. Update frontend/.env.local:");
    console.log(`   NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`);
    
    console.log("\n2. Update VPS:");
    console.log("   Option A: Run ./deploy.sh");
    console.log("   Option B: SSH and update manually:");
    console.log("   ssh system141@195.26.249.142");
    console.log(`   echo 'NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}' >> frontend/.env.local`);
    console.log("   docker-compose restart");
    
    if (network === "sepolia") {
      console.log("\n3. View on Etherscan:");
      console.log(`   https://sepolia.etherscan.io/address/${address}`);
    }
    
    console.log("\n" + "=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Add Sepolia ETH to your wallet");
    } else if (error.message.includes("invalid private key")) {
      console.log("\n💡 Solution: Check your private key in .env");
    }
  }
  
  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });