# Deploying Your Marketplace to Sepolia

This guide will help you deploy your marketplace contracts to the Sepolia testnet.

## Prerequisites

1. You need Sepolia ETH in your wallet
   - Get some from [Sepolia Faucet](https://sepolia-faucet.pk910.de/)
   - Or [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. You need an Alchemy API key
   - Sign up at [Alchemy](https://www.alchemy.com/)
   - Create a new app and select Sepolia network
   - Copy your API key

## Step 1: Set up your environment variables

Create a `.env` file in the root of your project by copying the example:

```
cp .env.example .env
```

Then edit the `.env` file and fill in:
- Your Alchemy API key
- Your wallet's private key (without the 0x prefix)
- Your Etherscan API key (optional, for contract verification)

## Step 2: Deploy your contracts to Sepolia

Run the deployment script:

```
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

This will:
- Deploy your MarketToken and DecentralizedMarketplace contracts
- Mint 1000 tokens to your account
- List a sample product
- Update your config file with the contract addresses

## Step 3: Verify your contracts on Etherscan (optional)

```
npx hardhat verify --network sepolia YOUR_TOKEN_ADDRESS 1000000
npx hardhat verify --network sepolia YOUR_MARKETPLACE_ADDRESS YOUR_TOKEN_ADDRESS
```

Replace `YOUR_TOKEN_ADDRESS` and `YOUR_MARKETPLACE_ADDRESS` with the addresses from the deployment output.

## Step 4: Use your application

1. Start your frontend:
   ```
   cd frontend
   npm run dev
   ```

2. Connect your MetaMask to Sepolia testnet
3. Your application will now use the real contracts deployed on Sepolia
4. You can create listings, make purchases, etc.

## Troubleshooting

If you see the error:
```
Error: could not decode result data (value="0x", info={ "method": "productCount", "signature": "productCount()" }, code=BAD_DATA, version=6.13.5)
```

It means your contracts are not properly deployed to Sepolia or the addresses in your config are incorrect.

Check:
1. The addresses in `frontend/config/contracts.json` match your deployed contracts
2. You're connected to Sepolia in MetaMask
3. Your contracts were deployed successfully

## Using the Token

Since the MarketToken is an ERC-20 token, you'll need to:
1. Add the token to MetaMask (using the token address)
2. Use the mint function to get tokens (if you're the contract owner)
3. Or transfer tokens to test accounts

## Advanced: Setting up your own RPC endpoint

If you want to set up your own RPC endpoint instead of using Alchemy:
1. Run your own Ethereum node on Sepolia
2. Update the URL in `hardhat.config.js`
3. Remove the dependency on the Alchemy API key 