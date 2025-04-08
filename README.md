# Decentralized Marketplace DApp

A decentralized application for buying and selling products using ERC-20 tokens on the Ethereum blockchain.

## Features

- User-friendly interface for listing and buying products
- ERC-20 token integration for secure payments
- MetaMask wallet integration
- Decentralized transactions on Ethereum

## Tech Stack

- Smart Contracts: Solidity
- Frontend: Next.js, React, Tailwind CSS
- Ethereum Integration: ethers.js
- Development Environment: Hardhat

## Prerequisites

- Node.js
- MetaMask browser extension

## Setup and Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Compile the smart contracts:
```bash
npm run compile
```

## Running the Application

1. Start a local Ethereum node:
```bash
npm run node
```

2. Deploy the contracts to the local node (in a new terminal):
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

3. Copy the deployed contract addresses (from the terminal output)

4. Start the frontend application:
```bash
npm run dev
```

5. Open your browser and navigate to http://localhost:3000

6. Enter the contract addresses in the setup page and save

7. Connect your MetaMask wallet to the local network:
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

8. Import an account from your local Hardhat node to MetaMask using the private key

## Usage

1. Connect your MetaMask wallet
2. List products for sale with token prices
3. Browse available products
4. Purchase products using ERC-20 tokens

## Smart Contracts

- `MarketToken.sol`: ERC-20 token implementation
- `DecentralizedMarketplace.sol`: Marketplace functionality
