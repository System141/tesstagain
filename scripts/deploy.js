const hre = require("hardhat");

async function main() {
  console.log("Deploying NFT Collection Factory...");

  const NFTCollectionFactory = await hre.ethers.getContractFactory("NFTCollectionFactory");
  const factory = await NFTCollectionFactory.deploy();

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("NFTCollectionFactory deployed to:", factoryAddress);

  // Wait for a few block confirmations to ensure the contract is mined
  console.log("Waiting for block confirmations...");
  await factory.deploymentTransaction().wait(5);

  // Verify the contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 