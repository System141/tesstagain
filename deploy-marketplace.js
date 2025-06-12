// Deploy NFT Marketplace to Sepolia
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFT Marketplace to Sepolia...");
  
  // Deploy edecek hesabın bilgilerini göster
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Hesap bakiyesini kontrol et
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.error("❌ No ETH in account! Please add Sepolia ETH.");
    console.log("Get free testnet ETH from:");
    console.log("- https://sepoliafaucet.com/");
    console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("- https://faucet.quicknode.com/ethereum/sepolia");
    process.exit(1);
  }
  
  // Contract'ı deploy et
  console.log("📦 Deploying contract...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await marketplace.waitForDeployment();
  
  const address = await marketplace.getAddress();
  console.log("✅ NFT Marketplace deployed to:", address);
  
  // Deployment bilgilerini kaydet
  const fs = require('fs');
  const deploymentInfo = {
    network: "sepolia",
    address: address,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    transactionHash: marketplace.deploymentTransaction()?.hash
  };
  
  fs.writeFileSync(
    'marketplace-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`);
  console.log("\n2. Update VPS deployment:");
  console.log("   Run: ./deploy.sh");
  console.log("\n3. View on Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${address}`);
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });