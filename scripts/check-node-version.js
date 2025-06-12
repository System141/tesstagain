// Check Node.js version compatibility
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

console.log("Node.js Version Check");
console.log("=====================");
console.log("Current version:", nodeVersion);
console.log("Major version:", majorVersion);

if (majorVersion < 14) {
  console.log("❌ Node.js version is too old!");
  console.log("");
  console.log("Required: Node.js 14 or higher");
  console.log("Current: Node.js", majorVersion);
  console.log("");
  console.log("Solutions:");
  console.log("1. Install Node.js 18+ from https://nodejs.org/");
  console.log("2. Or use nvm: nvm install 18 && nvm use 18");
  console.log("3. Or use Docker deployment (recommended)");
  console.log("");
  console.log("For immediate deployment without Node.js upgrade:");
  console.log("Use Docker: ./scripts/deploy.sh");
  process.exit(1);
} else if (majorVersion < 16) {
  console.log("⚠️  Node.js version is old but might work");
  console.log("Recommended: Upgrade to Node.js 18+");
} else {
  console.log("✅ Node.js version is compatible!");
}

console.log("");
console.log("Hardhat compatibility:");
if (majorVersion >= 18) {
  console.log("✅ Fully compatible with all features");
} else if (majorVersion >= 14) {
  console.log("⚠️  Basic compatibility - some warnings expected");
  console.log("   Use: npx hardhat run scripts/deploy-marketplace-legacy.js --network sepolia");
} else {
  console.log("❌ Not compatible - upgrade Node.js required");
}

console.log("");
console.log("Deployment recommendations:");
console.log("- Best: Use Docker deployment (./scripts/deploy.sh)");
console.log("- Alternative: Upgrade Node.js to version 18+");
console.log("- Quick fix: Use the legacy deployment script");