const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy MarketToken
  const tokenSupply = 1000000; // 1 million tokens
  const MarketToken = await hre.ethers.getContractFactory("MarketToken");
  const marketToken = await MarketToken.deploy(tokenSupply);
  await marketToken.waitForDeployment();
  
  const marketTokenAddress = await marketToken.getAddress();
  console.log(`MarketToken deployed to: ${marketTokenAddress}`);

  // Deploy Marketplace with token address
  const Marketplace = await hre.ethers.getContractFactory("DecentralizedMarketplace");
  const marketplace = await Marketplace.deploy(marketTokenAddress);
  await marketplace.waitForDeployment();
  
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`Marketplace deployed to: ${marketplaceAddress}`);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 