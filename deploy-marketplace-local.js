// Deploy to local Hardhat network for testing
const hre = require("hardhat");

async function main() {
  console.log("🏠 Deploying to local Hardhat network...");
  
  // Local network'te test account'ları var
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy contract
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy();
  await marketplace.waitForDeployment();
  
  const address = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", address);
  
  // Test: Platform fee'yi kontrol et
  const platformFee = await marketplace.platformFeeBps();
  console.log("Platform fee:", platformFee.toString(), "bps (2.5%)");
  
  console.log("\n📋 To use this in development:");
  console.log("1. Keep this terminal running");
  console.log("2. Update frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`);
  console.log("3. Connect MetaMask to localhost:8545");
  console.log("4. Import test account private keys from Hardhat");
}

main()
  .then(() => {
    console.log("\n✅ Local deployment complete!");
    console.log("Keep this terminal running...");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });