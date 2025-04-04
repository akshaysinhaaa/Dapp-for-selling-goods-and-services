import { useEffect, useState } from 'react';
import Head from 'next/head';
import Marketplace from '../components/Marketplace';

export default function Home() {
  const [contractAddresses, setContractAddresses] = useState({
    marketplaceAddress: '',
    tokenAddress: ''
  });
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState(null);
  const [contractConfig, setContractConfig] = useState(null);

  useEffect(() => {
    // Try to load from config file first
    try {
      const config = require('../config/contracts.json');
      setContractConfig(config);
      
      if (config && config.marketplaceAddress && config.tokenAddress) {
        console.log("Loaded contract addresses from config file");
        setContractAddresses({
          marketplaceAddress: config.marketplaceAddress,
          tokenAddress: config.tokenAddress
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log("Could not load from config file, will check localStorage");
    }
    
    // Fallback to localStorage
    const savedAddresses = localStorage.getItem('contractAddresses');
    if (savedAddresses) {
      setContractAddresses(JSON.parse(savedAddresses));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function checkNetwork() {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: "eth_chainId" });
          setNetwork(parseInt(chainId, 16));
        } catch (error) {
          console.error("Error getting network:", error);
        }
      }
    }
    
    checkNetwork();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const saveAddresses = () => {
    localStorage.setItem('contractAddresses', JSON.stringify(contractAddresses));
    alert('Contract addresses saved!');
  };

  const clearAddresses = () => {
    localStorage.removeItem('contractAddresses');
    setContractAddresses({
      marketplaceAddress: '',
      tokenAddress: ''
    });
    alert('Contract addresses cleared!');
  };

  const loadFromConfig = () => {
    try {
      if (contractConfig && contractConfig.marketplaceAddress && contractConfig.tokenAddress) {
        setContractAddresses({
          marketplaceAddress: contractConfig.marketplaceAddress,
          tokenAddress: contractConfig.tokenAddress
        });
        localStorage.setItem('contractAddresses', JSON.stringify({
          marketplaceAddress: contractConfig.marketplaceAddress,
          tokenAddress: contractConfig.tokenAddress
        }));
        alert('Loaded from config file!');
      } else {
        alert('No config file found. Run deploy script first.');
      }
    } catch (error) {
      alert('Error loading from config file: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Decentralized Marketplace</title>
        <meta name="description" content="Buy and sell products using ERC20 tokens" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {network && (
              <div className="bg-blue-100 p-2 text-center">
                <p>Connected to network ID: {network}</p>
                {contractConfig && contractConfig.networkId && network !== contractConfig.networkId && (
                  <p className="text-red-500 font-bold">
                    Warning: Your current network ({network}) does not match the network where contracts were deployed ({contractConfig.networkId})
                  </p>
                )}
              </div>
            )}
            
            {(!contractAddresses.marketplaceAddress || !contractAddresses.tokenAddress) && (
              <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Setup Contract Addresses</h2>
                <p className="mb-4 text-gray-600">Please enter the deployed contract addresses to continue.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marketplace Contract Address</label>
                    <input
                      type="text"
                      value={contractAddresses.marketplaceAddress}
                      onChange={(e) => setContractAddresses({ ...contractAddresses, marketplaceAddress: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Token Contract Address</label>
                    <input
                      type="text"
                      value={contractAddresses.tokenAddress}
                      onChange={(e) => setContractAddresses({ ...contractAddresses, tokenAddress: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={saveAddresses}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save and Continue
                    </button>
                    
                    <button
                      onClick={loadFromConfig}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Load from Config
                    </button>
                  </div>
                </div>
              </div>
            )}

            {contractAddresses.marketplaceAddress && contractAddresses.tokenAddress && (
              <div>
                <div className="max-w-4xl mx-auto p-4 flex justify-end">
                  <button
                    onClick={clearAddresses}
                    className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                  >
                    Reset Addresses
                  </button>
                </div>
                <Marketplace contractAddresses={contractAddresses} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 