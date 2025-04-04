import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button, Card, CardContent, Input, Table, TableBody, TableCell, TableHead, TableRow } from "./ui";
import MarketplaceABI from "../artifacts/contracts/DecentralizedMarketplace.sol/DecentralizedMarketplace.json";
import TokenABI from "../artifacts/contracts/MarketToken.sol/MarketToken.json";

export default function Marketplace({ contractAddresses }) {
  const { marketplaceAddress, tokenAddress } = contractAddresses;
  const [account, setAccount] = useState(null);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const [tokenBalance, setTokenBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [networkInfo, setNetworkInfo] = useState({ id: null, name: "Unknown" });
  
  // Add network names for display
  const networkNames = {
    "1": "Ethereum Mainnet",
    "11155111": "Sepolia Testnet",
    "31337": "Hardhat Local",
    "5": "Goerli Testnet",
    "137": "Polygon",
    "80001": "Mumbai Testnet"
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkCurrentNetwork();
    
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkCurrentNetwork();
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    // Validate contract addresses
    if (marketplaceAddress && tokenAddress) {
      validateContracts();
    }
  }, [marketplaceAddress, tokenAddress, account]);

  async function validateContracts() {
    if (!window.ethereum || !account) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.chainId.toString());
      
      // Different behavior based on network
      if (network.chainId === 1n) { // Demo mode only for Mainnet now
        console.log(`Connected to Mainnet, bypassing code validation`);
        setNetworkError(null);
        return;
      }
      
      // Check if addresses have code deployed
      const marketplaceCode = await provider.getCode(marketplaceAddress);
      const tokenCode = await provider.getCode(tokenAddress);
      
      console.log("Marketplace contract code length:", marketplaceCode.length);
      console.log("Token contract code length:", tokenCode.length);
      
      // '0x' means no code at the address
      if (marketplaceCode === '0x' || marketplaceCode === '0x0') {
        setNetworkError("No contract deployed at marketplace address. Please check your connected network and address.");
        return;
      }
      
      if (tokenCode === '0x' || tokenCode === '0x0') {
        setNetworkError("No contract deployed at token address. Please check your connected network and address.");
        return;
      }
      
      setNetworkError(null);
    } catch (error) {
      console.error("Error validating contracts:", error);
      setNetworkError("Could not validate contracts. Please check addresses and network connection.");
    }
  }

  async function checkIfWalletIsConnected() {
    try {
      if (!window.ethereum) {
        console.log("Make sure you have MetaMask installed!");
        return;
      }

      // Get connected chain ID
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain ID:", parseInt(chainId, 16));

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setAccount(account);
        fetchProducts();
        fetchTokenBalance(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Add event listener for account changes in MetaMask
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log("Account changed to:", accounts[0]);
        setAccount(accounts[0]);
        fetchTokenBalance(accounts[0]);
        fetchProducts();
      });
      
      // Clean up listener when component unmounts
      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
      };
    }
  }, []);

  // Add useEffect to refresh data periodically
  useEffect(() => {
    if (account) {
      // Refresh data initially
      fetchTokenBalance(account);
      fetchProducts();
      
      // Set up interval to refresh data every 5 seconds
      const intervalId = setInterval(() => {
        fetchTokenBalance(account);
        fetchProducts();
      }, 5000);
      
      // Clean up interval when component unmounts or account changes
      return () => clearInterval(intervalId);
    }
  }, [account]);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setAccount(accounts[0]);
      fetchProducts();
      fetchTokenBalance(accounts[0]);
      
      // Try adding a sample product for testing if no products exist
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(marketplaceAddress, MarketplaceABI.abi, provider);
        const count = await contract.productCount();
        
        if (count.toString() === "0") {
          console.log("No products found, adding a sample product for testing");
          await addSampleProduct();
        }
      } catch (error) {
        console.error("Error checking products:", error);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function addSampleProduct() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(marketplaceAddress, MarketplaceABI.abi, signer);
      
      const tx = await contract.listProduct("Sample Product", ethers.parseUnits("10", 18));
      console.log("Sample product transaction sent:", tx.hash);
      await tx.wait();
      console.log("Sample product added successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error adding sample product:", error);
    }
  }

  async function fetchTokenBalance(account) {
    if (!tokenAddress || !account) return;
    
    try {
      console.log("Fetching token balance for account:", account);
      console.log("Using token address:", tokenAddress);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.chainId.toString());
      
      // Add fallback values only for mainnet
      if (network.chainId === 1n) { // Demo mode only for Mainnet
        console.log(`Using Mainnet demo mode, showing placeholder balance`);
        setTokenBalance("1000.0");
        return;
      }
      
      // Check contract code existence first
      const code = await provider.getCode(tokenAddress);
      if (code === '0x' || code === '0x0') {
        console.error("No contract deployed at the token address on this network");
        if (!networkError) {
          setNetworkError(`No token contract found at address ${tokenAddress} on ${networkInfo.name}. Please deploy your contracts to this network first.`);
        }
        setTokenBalance("0.0");
        return;
      }
      
      const tokenContract = new ethers.Contract(tokenAddress, TokenABI.abi, provider);
      
      try {
        const balance = await tokenContract.balanceOf(account);
        setTokenBalance(ethers.formatUnits(balance, 18));
      } catch (callError) {
        console.error("Error calling token contract method:", callError);
        setTokenBalance("0.0");
        
        // Special handling for Sepolia
        if (network.chainId === 11155111n && !networkError) {
          setNetworkError(`Token contract at ${tokenAddress.slice(0, 8)}...${tokenAddress.slice(-6)} on Sepolia doesn't match the expected interface. Have you deployed your contracts to Sepolia?`);
        }
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setTokenBalance("0.0");
    }
  }

  async function fetchProducts() {
    if (!marketplaceAddress) return;
    
    try {
      console.log("Fetching products from address:", marketplaceAddress);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.chainId.toString());
      
      // Add fallback values only for mainnet
      if (network.chainId === 1n) { // Demo mode only for Mainnet
        console.log(`Using Mainnet demo mode, showing placeholder products`);
        const dummyProducts = [
          {
            id: ethers.getBigInt(1),
            name: "Test Product 1",
            price: ethers.parseUnits("10", 18),
            seller: account || "0x0000000000000000000000000000000000000000",
            sold: false
          },
          {
            id: ethers.getBigInt(2),
            name: "Test Product 2",
            price: ethers.parseUnits("20", 18),
            seller: account || "0x0000000000000000000000000000000000000000",
            sold: false
          }
        ];
        setProducts(dummyProducts);
        return;
      }
      
      // Check contract code existence first
      const code = await provider.getCode(marketplaceAddress);
      if (code === '0x' || code === '0x0') {
        console.error("No contract deployed at the marketplace address on this network");
        setNetworkError(`No contract found at address ${marketplaceAddress} on ${networkInfo.name}. Please deploy your contracts to this network first.`);
        setProducts([]);
        return;
      }
      
      const contract = new ethers.Contract(marketplaceAddress, MarketplaceABI.abi, provider);
      
      try {
        // Check product count first
        const count = await contract.productCount();
        console.log("Product count:", count.toString());
        
        if (count.toString() === "0") {
          console.log("No products available yet");
          setProducts([]);
          return;
        }
        
        const items = await contract.getProducts();
        console.log("Products fetched:", items);
        setProducts(items);
      } catch (callError) {
        console.error("Error calling contract method:", callError);
        
        // Special handling for Sepolia
        if (network.chainId === 11155111n) {
          setNetworkError(`Contract at ${marketplaceAddress.slice(0, 8)}...${marketplaceAddress.slice(-6)} on Sepolia doesn't match the expected interface. Have you deployed your contracts to Sepolia using the deploy-sepolia.js script?`);
          
          // Provide temporary demo mode for Sepolia if user hasn't deployed yet
          console.log("Using temporary demo mode for Sepolia");
          const dummyProducts = [
            {
              id: ethers.getBigInt(1),
              name: "Demo Product (Sepolia)",
              price: ethers.parseUnits("10", 18),
              seller: account || "0x0000000000000000000000000000000000000000",
              sold: false
            }
          ];
          setProducts(dummyProducts);
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  }

  async function listProduct() {
    if (!newProduct.name || !newProduct.price) {
      alert("Please enter a product name and price");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      // If on mainnet, just simulate success
      if (network.chainId === 1n) { // Demo mode only for Mainnet
        console.log(`On Mainnet demo mode, simulating product listing`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        
        const dummyProduct = {
          id: ethers.getBigInt(products.length + 1),
          name: newProduct.name,
          price: ethers.parseUnits(newProduct.price, 18),
          seller: account,
          sold: false
        };
        
        setProducts([...products, dummyProduct]);
        setNewProduct({ name: "", price: "" });
        alert("Product listed successfully (Demo Mode)");
        return;
      }
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(marketplaceAddress, MarketplaceABI.abi, signer);
      
      const price = ethers.parseUnits(newProduct.price, 18);
      const tx = await contract.listProduct(newProduct.name, price);
      await tx.wait();
      
      setNewProduct({ name: "", price: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error listing product:", error);
      alert("Error listing product. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  async function buyProduct(id, price) {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      // If on mainnet, just simulate success
      if (network.chainId === 1n) { // Demo mode only for Mainnet
        console.log(`On Mainnet demo mode, simulating product purchase`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        
        // Update the product state to mark it as sold
        const updatedProducts = products.map(p => {
          if (p.id.toString() === id.toString()) {
            return { ...p, sold: true };
          }
          return p;
        });
        
        setProducts(updatedProducts);
        alert("Purchase successful! (Demo Mode)");
        return;
      }
      
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("Buying product with address:", signerAddress);
      
      // Check token balance first
      const tokenContract = new ethers.Contract(tokenAddress, TokenABI.abi, signer);
      const balance = await tokenContract.balanceOf(signerAddress);
      console.log("Current token balance:", ethers.formatUnits(balance, 18));
      console.log("Product price:", ethers.formatUnits(price, 18));
      
      if (balance < price) {
        alert(`Insufficient token balance. You have ${ethers.formatUnits(balance, 18)} MKT but need ${ethers.formatUnits(price, 18)} MKT.`);
        setLoading(false);
        return;
      }
      
      // Check allowance first
      const allowance = await tokenContract.allowance(signerAddress, marketplaceAddress);
      console.log("Current allowance:", ethers.formatUnits(allowance, 18));
      
      // If allowance is too low, approve the tokens first
      if (allowance < price) {
        console.log("Approving tokens for marketplace...");
        try {
          // Use a large approval amount to avoid needing multiple approvals
          const approvalAmount = ethers.parseUnits("1000000", 18); // 1 million tokens
          const approveTx = await tokenContract.approve(marketplaceAddress, approvalAmount);
          console.log("Approve transaction sent:", approveTx.hash);
          
          // Wait for approval transaction to be mined
          console.log("Waiting for approval transaction to be mined...");
          const approveReceipt = await approveTx.wait();
          console.log("Approval transaction confirmed:", approveReceipt.hash);
        } catch (approvalError) {
          console.error("Error approving tokens:", approvalError);
          alert("Failed to approve tokens for marketplace. Please try again.");
          setLoading(false);
          return;
        }
      }
      
      // Execute purchase
      try {
        console.log("Executing purchase transaction...");
        const marketContract = new ethers.Contract(marketplaceAddress, MarketplaceABI.abi, signer);
        const buyTx = await marketContract.buyProduct(id);
        console.log("Buy transaction sent:", buyTx.hash);
        
        // Wait for buy transaction to be mined
        console.log("Waiting for purchase transaction to be mined...");
        const buyReceipt = await buyTx.wait();
        console.log("Purchase transaction confirmed:", buyReceipt.hash);
        
        // Important: Use signerAddress to fetch the updated balance
        // This ensures we're getting the balance for the account that made the purchase
        fetchTokenBalance(signerAddress);
        fetchProducts();
        
        // Get the updated balance immediately to show in the alert
        const newBalance = await tokenContract.balanceOf(signerAddress);
        console.log("New token balance after purchase:", ethers.formatUnits(newBalance, 18));
        
        alert(`Purchase successful! Your new balance is ${ethers.formatUnits(newBalance, 18)} MKT`);
      } catch (purchaseError) {
        console.error("Error executing purchase:", purchaseError);
        
        // Handle different error cases
        if (purchaseError.message.includes("Product not available")) {
          alert("This product is not available for purchase.");
        } else if (purchaseError.message.includes("Payment failed")) {
          alert("Payment failed. Please check your token balance and approval.");
        } else {
          alert("Error buying product. Check console for details.");
        }
      }
    } catch (error) {
      console.error("Error buying product:", error);
      alert("Error buying product. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  // Add utility function to reset addresses in local storage
  function resetContractAddresses() {
    if (confirm("This will clear saved contract addresses. Are you sure?")) {
      localStorage.removeItem('contractAddresses');
      alert("Contract addresses cleared. Please refresh the page.");
    }
  }

  async function checkCurrentNetwork() {
    if (!window.ethereum) return;
    
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const networkId = parseInt(chainId, 16).toString();
      
      setNetworkInfo({
        id: networkId,
        name: networkNames[networkId] || `Network ${networkId}`
      });
      
      console.log("Connected to network:", networkId, networkNames[networkId] || "Unknown Network");
    } catch (error) {
      console.error("Error checking network:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="mr-3 bg-white rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              Decentralized Marketplace
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className={`px-4 py-2 rounded-full text-sm font-medium transition-transform hover:scale-105 ${
              networkInfo.id === "1" ? "bg-purple-700 text-purple-100" :
              networkInfo.id === "11155111" ? "bg-green-700 text-green-100" : 
              networkInfo.id === "31337" ? "bg-blue-700 text-blue-100" : 
              "bg-gray-700 text-gray-100"
            }`}>
              <span className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  networkInfo.id === "1" || networkInfo.id === "11155111" || networkInfo.id === "31337" 
                    ? "bg-green-400 animate-pulse" 
                    : "bg-yellow-400"
                }`}></span>
                {networkInfo.name}
              </span>
            </div>
            
            {!account && (
              <Button 
                onClick={connectWallet} 
                className="bg-white text-indigo-700 hover:bg-indigo-100 transition-all hover:shadow-lg"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto p-6">
        {networkError && (
          <div className="bg-red-900/60 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <strong>Error:</strong> <span className="ml-1">{networkError}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button onClick={resetContractAddresses} className="bg-red-700 hover:bg-red-800 transition-colors">
                Reset Addresses
              </Button>
              {networkInfo.id === "11155111" && (
                <Button 
                  onClick={() => window.open("https://sepolia-faucet.pk910.de/", "_blank")}
                  className="bg-blue-700 hover:bg-blue-800 transition-colors"
                >
                  Get Sepolia ETH
                </Button>
              )}
            </div>
          </div>
        )}
        
        {networkInfo.id === "11155111" && networkError && (
          <div className="bg-yellow-900/60 border border-yellow-600 text-yellow-100 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <strong>Need to deploy to Sepolia?</strong>
            </div>
            <div className="mt-2">Run this command in your project:</div>
            <pre className="bg-black/50 text-green-400 p-3 mt-2 rounded-lg overflow-x-auto font-mono text-sm border border-gray-700">
              npx hardhat run scripts/deploy-sepolia.js --network sepolia
            </pre>
          </div>
        )}
        
        {networkInfo.id === "1" && (
          <div className="bg-gradient-to-r from-yellow-800/60 to-amber-800/60 border border-yellow-600 text-yellow-100 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <strong>Demo Mode:</strong> <span className="ml-1">Using simulated data on Ethereum Mainnet. Contract interactions are mocked.</span>
            </div>
          </div>
        )}
        
        {account && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 shadow-xl hover:shadow-indigo-500/10 transition-all">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-gray-400 font-medium">Account</h3>
              </div>
              <div className="text-md font-mono bg-slate-900 p-2 rounded truncate">
                {account}
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 shadow-xl hover:shadow-purple-500/10 transition-all">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-gray-400 font-medium">Token Balance</h3>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {tokenBalance} <span className="text-sm text-gray-400 font-normal">MKT</span>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 shadow-xl hover:shadow-blue-500/10 transition-all">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-gray-400 font-medium">Contracts</h3>
              </div>
              <div className="text-xs font-mono bg-slate-900 p-2 rounded mb-1">
                <span className="text-gray-500">Marketplace:</span> {marketplaceAddress.slice(0, 8)}...{marketplaceAddress.slice(-6)}
              </div>
              <div className="text-xs font-mono bg-slate-900 p-2 rounded">
                <span className="text-gray-500">Token:</span> {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
              </div>
            </div>
          </div>
        )}
        
        {account && (
          <Card className="mb-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-700/50 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-indigo-800/50">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                List a New Product
              </h2>
            </div>
            <CardContent className="bg-slate-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input 
                  placeholder="Product Name" 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <Input 
                  placeholder="Price (in tokens)" 
                  value={newProduct.price} 
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button 
                onClick={listProduct} 
                disabled={loading}
                className={`w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all ${loading ? 'opacity-70' : 'hover:shadow-lg hover:shadow-indigo-500/20'}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "List Product"}
              </Button>
            </CardContent>
          </Card>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Available Products
          </h2>
          
          {products.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-slate-400">No products available at the moment.</p>
              {account && (
                <Button 
                  onClick={addSampleProduct}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Add Sample Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-700 shadow-xl bg-slate-800/50">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Seller</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {products.map((p, index) => (
                      <tr key={p.id.toString()} className={`${index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/60'} hover:bg-slate-700/40 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-400">{p.id.toString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{p.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-purple-300">{ethers.formatUnits(p.price, 18)}</span>
                          <span className="ml-1 text-xs text-slate-400">MKT</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono truncate max-w-[100px]">
                          {p.seller === account ? (
                            <span className="text-green-400">You</span>
                          ) : (
                            p.seller.slice(0, 6) + '...' + p.seller.slice(-4)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {p.sold ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-900/40 text-red-300 border border-red-700/50">
                              Sold
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900/40 text-green-300 border border-green-700/50">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!p.sold && account && p.seller !== account && (
                            <Button 
                              onClick={() => buyProduct(p.id, p.price)}
                              disabled={loading}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm px-4 py-1"
                            >
                              {loading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing
                                </span>
                              ) : "Buy Now"}
                            </Button>
                          )}
                          {p.sold && (
                            <span className="text-slate-500 text-sm">Sold Out</span>
                          )}
                          {p.seller === account && (
                            <span className="text-yellow-400 text-sm">Your Product</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-slate-500 text-sm">
          <p>Decentralized Marketplace powered by Ethereum Smart Contracts</p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">About</a>
            <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms</a>
            <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
} 