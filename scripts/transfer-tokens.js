const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// First argument is recipient, second is amount
const recipient = process.argv[2];
const amount = process.argv[3];

async function main() {
  try {
    if (!recipient || !amount) {
      console.error("Usage: npx hardhat run scripts/transfer-tokens.js --network localhost 0xRECIPIENT_ADDRESS 100");
      process.exit(1);
    }

    // Load contract addresses from config file
    const configPath = path.join(__dirname, "../frontend/config/contracts.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const tokenAddress = config.tokenAddress;

    console.log("Using token address:", tokenAddress);
    console.log("Recipient:", recipient);
    console.log("Amount:", amount, "MKT");
    
    const amountInWei = hre.ethers.parseUnits(amount, 18);
    
    // Get sender (first account)
    const accounts = await hre.ethers.getSigners();
    const sender = accounts[0];
    
    // Connect to the token contract
    const tokenContract = await hre.ethers.getContractAt("MarketToken", tokenAddress);
    
    // Check sender balance
    const senderBalance = await tokenContract.balanceOf(sender.address);
    console.log(`Sender balance: ${hre.ethers.formatUnits(senderBalance, 18)} MKT`);
    
    if (senderBalance < amountInWei) {
      console.error(`Insufficient balance. You need ${amount} MKT but have ${hre.ethers.formatUnits(senderBalance, 18)} MKT`);
      process.exit(1);
    }
    
    // Transfer tokens
    console.log(`Transferring ${amount} MKT from ${sender.address} to ${recipient}...`);
    const tx = await tokenContract.transfer(recipient, amountInWei);
    await tx.wait();
    
    console.log("Tokens transferred successfully!");
    
    // Get updated balances
    const newSenderBalance = await tokenContract.balanceOf(sender.address);
    const newRecipientBalance = await tokenContract.balanceOf(recipient);
    
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