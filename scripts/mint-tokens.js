const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Load contract addresses from config file
    const configPath = path.join(__dirname, "../frontend/config/contracts.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const tokenAddress = config.tokenAddress;

    console.log("Using token address:", tokenAddress);
    
    // Get recipient address from command line or use the first account
    let recipientAddress = process.argv[2];
    if (!recipientAddress) {
      const accounts = await hre.ethers.getSigners();
      recipientAddress = accounts[0].address;
      console.log("No recipient specified, using first account:", recipientAddress);
    }

    // Amount to mint - default 1000 tokens
    const amount = hre.ethers.parseUnits("1000", 18);
    
    // Connect to the token contract
    const tokenContract = await hre.ethers.getContractAt("MarketToken", tokenAddress);
    
    // Mint tokens
    console.log(`Minting ${hre.ethers.formatUnits(amount, 18)} MKT tokens to ${recipientAddress}...`);
    const tx = await tokenContract.mint(recipientAddress, amount);
    await tx.wait();
    
    console.log("Tokens minted successfully!");
    
    // Get the new balance
    const balance = await tokenContract.balanceOf(recipientAddress);
    console.log(`New balance: ${hre.ethers.formatUnits(balance, 18)} MKT`);
    
  } catch (error) {
    console.error("Error minting tokens:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 