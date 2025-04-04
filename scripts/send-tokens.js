const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Your address - hardcoded for simplicity
const RECIPIENT = "0x0f396E3fdb9C4c41bF309ffa65963957a0E99933";
const AMOUNT = "50000"; // 50000 tokens

async function main() {
  try {
    // Load contract addresses from config file
    const configPath = path.join(__dirname, "../frontend/config/contracts.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const tokenAddress = config.tokenAddress;

    console.log("Using token address:", tokenAddress);
    console.log("Recipient:", RECIPIENT);
    console.log("Amount:", AMOUNT, "MKT");
    
    const amountInWei = hre.ethers.parseUnits(AMOUNT, 18);
    
    // Get sender (first account)
    const accounts = await hre.ethers.getSigners();
    const sender = accounts[0];
    
    // Connect to the token contract
    const tokenContract = await hre.ethers.getContractAt("MarketToken", tokenAddress);
    
    // Check sender balance
    const senderBalance = await tokenContract.balanceOf(sender.address);
    console.log(`Sender balance: ${hre.ethers.formatUnits(senderBalance, 18)} MKT`);
    
    if (senderBalance < amountInWei) {
      console.error(`Insufficient balance. You need ${AMOUNT} MKT but have ${hre.ethers.formatUnits(senderBalance, 18)} MKT`);
      process.exit(1);
    }
    
    // Transfer tokens
    console.log(`Transferring ${AMOUNT} MKT from ${sender.address} to ${RECIPIENT}...`);
    const tx = await tokenContract.transfer(RECIPIENT, amountInWei);
    await tx.wait();
    
    console.log("Tokens transferred successfully!");
    
    // Get updated balances
    const newSenderBalance = await tokenContract.balanceOf(sender.address);
    const newRecipientBalance = await tokenContract.balanceOf(RECIPIENT);
    
    console.log(`New sender balance: ${hre.ethers.formatUnits(newSenderBalance, 18)} MKT`);
    console.log(`Recipient balance: ${hre.ethers.formatUnits(newRecipientBalance, 18)} MKT`);
    
  } catch (error) {
    console.error("Error transferring tokens:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 