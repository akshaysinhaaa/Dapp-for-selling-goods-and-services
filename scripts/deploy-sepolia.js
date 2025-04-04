const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying contracts to Sepolia...");

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

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  // Mint some tokens for testing
  const mintAmount = hre.ethers.parseUnits("1000", 18); // 1000 tokens
  await marketToken.mint(deployer.address, mintAmount);
  console.log(`Minted ${hre.ethers.formatUnits(mintAmount, 18)} tokens to ${deployer.address}`);

  // List a sample product
  const productPrice = hre.ethers.parseUnits("10", 18); // 10 tokens
  const tx = await marketplace.listProduct("Sample Product", productPrice);
  await tx.wait();
  console.log("Listed a sample product in the marketplace");

  // Save addresses to a file for easy access
  const addressesData = {
    marketplaceAddress,
    tokenAddress: marketTokenAddress,
    networkId: 11155111  // Sepolia network ID
  };

  const outputDir = path.join(__dirname, "../frontend/config");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "contracts.json"),
    JSON.stringify(addressesData, null, 2)
  );

  console.log(`
-------------------------------------------------
✅ Deployment to Sepolia complete!

Contract addresses saved to: frontend/config/contracts.json

Network ID: 11155111 (Sepolia)
Marketplace: ${marketplaceAddress}
Token: ${marketTokenAddress}
-------------------------------------------------

IMPORTANT: To verify contracts on Etherscan:
npx hardhat verify --network sepolia ${marketTokenAddress} ${tokenSupply}
npx hardhat verify --network sepolia ${marketplaceAddress} ${marketTokenAddress}
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 