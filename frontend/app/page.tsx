'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, parseEther, ethers } from 'ethers';
import NFTCollections from './components/NFTCollections';
import EnhancedMarketplaceOverview from './components/EnhancedMarketplaceOverview';
import ImageUploader from './components/ImageUploader';
import EmergencyDebug from './components/EmergencyDebug';
import EnhancedUserProfile from './components/EnhancedUserProfile';
import { UserProfileManager } from './utils/userProfile';

const FACTORY_ADDRESS = '0xe553934B8AD246a45785Ea080d53024aAbd39189';
const FACTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "baseURI",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "maxSupply",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "publicMintPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxPerWallet",
        "type": "uint256"
      },
      // Allowlist parameters
      {
        "internalType": "uint256",
        "name": "allowlistMintPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "allowlistDurationSeconds",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "allowlistedAddresses",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "maxPerAllowlistWallet",
        "type": "uint256"
      },
      // Royalty parameter
      {
        "internalType": "uint96",
        "name": "royaltyBps",
        "type": "uint96"
      }
    ],
    "name": "createCollection",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "collectionAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "CollectionCreated",
    "type": "event"
  }
] as const;

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'create' | 'mint'>('marketplace');
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    baseURI: '',
    maxSupply: '',
    mintPrice: '',
    maxPerWallet: '',
    royaltyPercentage: ''
  });
  const [showAllowlistStage, setShowAllowlistStage] = useState(false);
  const [allowlistData, setAllowlistData] = useState({
    mintPrice: '',
    stageDays: '1',
    stageHours: '0',
    addresses: ''
  });
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => window.location.reload());
      }
    };
  }, []);

  async function handleAccountsChanged(accounts: string[]): Promise<void> {
    if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
    } else {
        setIsConnected(false);
        setAccount('');
    }
  }

  async function checkConnection() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
        } else {
          setIsConnected(false);
          setAccount('');
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
        setAccount('');
      }
    }
  }

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
        });
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
            setIsConnected(true);
            setAccount(accounts[0]);
        } else {
            alert('No accounts found. Please ensure MetaMask is set up correctly.');
        }
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/', 'https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding Sepolia network:', addError);
            alert('Failed to add Sepolia network. Please add it manually to MetaMask.');
          }
        } else {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet. Make sure MetaMask is active and you approve the connection.');
        }
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this application.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.ethereum || !isConnected || !account) {
        alert('Please connect your wallet first.');
        return;
    }

    setIsLoading(true);
    setTxHash('');

    // Set a hard timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Transaction timeout - forcing loading to stop');
      setIsLoading(false);
      alert('Transaction timed out. Please try again or check your network connection.');
    }, 120000); // 2 minutes timeout

    try {
      console.log('Creating collection - initializing provider...');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      const publicMintPrice = parseEther(formData.mintPrice || "0");
      const maxSupply = BigInt(formData.maxSupply || "0");
      const maxPerWallet = BigInt(formData.maxPerWallet || "0");
      const royaltyBps = Math.floor(parseFloat(formData.royaltyPercentage || "0") * 100);
      if (royaltyBps < 0 || royaltyBps > 10000) {
        alert("Royalty percentage must be between 0 and 100 (e.g., 2.5 for 2.5%).");
        clearTimeout(timeout);
        setIsLoading(false);
        return;
      }

      console.log('Creating collection - preparing transaction...');
      let tx;
      if (showAllowlistStage) {
        const allowlistAddressesRaw = allowlistData.addresses;
        const allowlistAddresses = allowlistAddressesRaw
          .split(/[\s,;\r\n]+/) 
          .map(addr => addr.trim())
          .filter(addr => ethers.isAddress(addr)); 

        const allowlistDurationSeconds = 
          (parseInt(allowlistData.stageDays || "0") * 24 * 60 * 60) + 
          (parseInt(allowlistData.stageHours || "0") * 60 * 60);
        
        const allowlistMintPrice = parseEther(allowlistData.mintPrice || "0");
        const maxPerAllowlistWallet = maxPerWallet;

        if (allowlistAddresses.length === 0 && allowlistDurationSeconds > 0 && allowlistData.addresses.trim() !== '') {
            alert("Allowlist is active but no valid addresses were provided or addresses are invalid. Please check the format (0x...).");
            clearTimeout(timeout);
            setIsLoading(false);
            return;
        }
         if (allowlistDurationSeconds > 0 && !allowlistData.mintPrice) {
            alert("Please set a mint price for the allowlist stage if duration is greater than 0.");
            clearTimeout(timeout);
            setIsLoading(false);
            return;
        }

        console.log('Creating collection - sending transaction with allowlist...');
        tx = await Promise.race([
          contract.createCollection(
            formData.name,
            formData.symbol,
            formData.baseURI,
            maxSupply,
            publicMintPrice,
            maxPerWallet,
            allowlistMintPrice,
            BigInt(allowlistDurationSeconds),
            allowlistAddresses,
            maxPerAllowlistWallet, 
            royaltyBps
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction submission timeout')), 60000))
        ]);
      } else {
        console.log('Creating collection - sending transaction...');
        tx = await Promise.race([
          contract.createCollection(
            formData.name,
            formData.symbol,
            formData.baseURI,
            maxSupply,
            publicMintPrice,
            maxPerWallet,
            parseEther("0"), // allowlistMintPrice
            BigInt(0), // allowlistDurationSeconds
            [], // allowlistedAddresses
            BigInt(0), // maxPerAllowlistWallet
            royaltyBps
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction submission timeout')), 60000))
        ]);
      }

      console.log('Creating collection - waiting for confirmation...');
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000))
      ]);

      clearTimeout(timeout);
      
      if (receipt && receipt.status === 1) {
        setTxHash(tx.hash);
        alert('Collection created successfully! Transaction Hash: ' + tx.hash);
        
        // Add activity to user profile
        UserProfileManager.addActivity(account, {
          type: 'create',
          description: `Created collection: ${formData.name}`,
          txHash: tx.hash,
          collectionAddress: receipt.logs?.[0]?.address || '',
          collectionName: formData.name
        });
        
        // Reset form
        setFormData({ name: '', symbol: '', baseURI: '', maxSupply: '', mintPrice: '', maxPerWallet: '', royaltyPercentage: '' });
        setShowAllowlistStage(false);
        setAllowlistData({ mintPrice: '', stageDays: '1', stageHours: '0', addresses: '' });
      } else {
        alert('Transaction failed or was reverted. Check the console for details.');
      }
    } catch (error: unknown) {
      clearTimeout(timeout);
      console.error('Error creating collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error. Check console.';
      
      if (errorMessage.includes('timeout')) {
        alert(`Transaction timed out: ${errorMessage}. Please check your network connection and try again.`);
      } else if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        alert('Transaction was rejected. Please try again.');
      } else {
        alert(`An error occurred during collection creation: ${errorMessage}`);
      }
    }
    
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Magic Eden Style Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                Jugiter
              </h1>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'marketplace'
                      ? 'text-white bg-zinc-800'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  Trade
                </button>
                <button
                  onClick={() => setActiveTab('mint')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'mint'
                      ? 'text-white bg-zinc-800'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  Collections
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'create'
                      ? 'text-white bg-zinc-800'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  Create
                </button>
              </nav>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search collections on Jugiter"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-2 pr-10 focus:border-purple-500 focus:outline-none text-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Network Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-zinc-300">Sepolia</span>
              </div>

              {/* Wallet Connection */}
              <button
                onClick={isConnected ? () => setShowUserProfile(true) : connectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 text-sm"
                disabled={isLoading}
              >
                {isConnected ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mobile Search Bar */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search collections..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 pr-10 focus:border-purple-500 focus:outline-none text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mb-6">
          <div className="flex bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'marketplace'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Trade
            </button>
            <button
              onClick={() => setActiveTab('mint')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'mint'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Collections
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create
            </button>
          </div>
        </div>

        {isConnected ? (
          <>

            {activeTab === 'marketplace' ? (
              <EnhancedMarketplaceOverview />
            ) : activeTab === 'create' ? (
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-white text-center mb-8">Create Collection</h2>
                  
                  <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Collection Name</label>
                        <input type="text" id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 focus:border-zinc-500 focus:outline-none" placeholder="My Awesome Collection" required disabled={isLoading}/>
                    </div>
                    <div>
                        <label htmlFor="symbol" className="block text-sm font-medium text-zinc-300 mb-2">Symbol</label>
                        <input type="text" id="symbol" value={formData.symbol} onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 focus:border-zinc-500 focus:outline-none" placeholder="MAC" required disabled={isLoading}/>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="baseURI" className="block text-sm font-medium text-zinc-300 mb-2">Metadata URI</label>
                    <div className="space-y-3">
                      <input type="text" id="baseURI" value={formData.baseURI} onChange={(e) => setFormData(prev => ({ ...prev, baseURI: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 focus:border-zinc-500 focus:outline-none" placeholder="ipfs://Your CID Here/" required disabled={isLoading}/>
                      <button
                        type="button"
                        onClick={() => setShowImageUploader(!showImageUploader)}
                        className="w-full bg-zinc-700 text-zinc-300 py-2 rounded-lg font-medium hover:bg-zinc-600 transition-colors text-sm"
                      >
                        {showImageUploader ? 'Hide Image Uploader' : 'Upload Image & Generate Metadata'}
                      </button>
                      {showImageUploader && (
                        <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                          <h3 className="text-sm font-medium text-zinc-300 mb-3">Upload Collection Image</h3>
                          <ImageUploader
                            onUploadComplete={(baseURI) => {
                              setFormData(prev => ({ ...prev, baseURI }));
                              setShowImageUploader(false);
                            }}
                            pinataApiKey={process.env.NEXT_PUBLIC_PINATA_API_KEY || ''}
                            pinataSecretKey={process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || ''}
                          />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">IPFS URI for your collection metadata, or use the uploader above</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="maxSupply" className="block text-sm font-medium text-zinc-300 mb-2">Max Supply</label>
                        <input type="number" id="maxSupply" value={formData.maxSupply} onChange={(e) => setFormData(prev => ({ ...prev, maxSupply: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 focus:border-zinc-500 focus:outline-none" placeholder="1000" required min="1" disabled={isLoading}/>
                    </div>
                    <div>
                        <label htmlFor="mintPrice" className="block text-sm font-medium text-zinc-300 mb-2">Mint Price (ETH)</label>
                        <input type="text" id="mintPrice" value={formData.mintPrice} onChange={(e) => setFormData(prev => ({ ...prev, mintPrice: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 focus:border-zinc-500 focus:outline-none" placeholder="0.05" required disabled={isLoading}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="maxPerWallet" className="block text-sm font-medium text-zinc-300 mb-2">Max Per Wallet</label>
                        <input type="number" id="maxPerWallet" value={formData.maxPerWallet} onChange={(e) => setFormData(prev => ({ ...prev, maxPerWallet: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 focus:border-zinc-500 focus:outline-none" placeholder="5" required min="1" disabled={isLoading}/>
                    </div>
                    <div>
                        <label htmlFor="royaltyPercentage" className="block text-sm font-medium text-zinc-300 mb-2">Royalty (%)</label>
                        <input type="number" id="royaltyPercentage" value={formData.royaltyPercentage} onChange={(e) => setFormData(prev => ({ ...prev, royaltyPercentage: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 focus:border-zinc-500 focus:outline-none" placeholder="2.5" step="0.1" min="0" max="100" disabled={isLoading}/>
                    </div>
                  </div>

                  {/* Optional Allowlist */}
                  <div className="pt-6 border-t border-zinc-800">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={showAllowlistStage}
                        onChange={(e) => setShowAllowlistStage(e.target.checked)}
                        className="w-4 h-4 text-white bg-zinc-800 border-zinc-700 rounded focus:ring-0"
                      />
                      <span className="text-sm text-zinc-300">Enable allowlist phase (optional)</span>
                    </label>
                    
                    {showAllowlistStage && (
                      <div className="mt-4 space-y-4 p-4 bg-zinc-800 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="allowlistMintPrice" className="block text-xs text-zinc-400 mb-1">Allowlist Price (ETH)</label>
                            <input type="text" id="allowlistMintPrice" value={allowlistData.mintPrice} onChange={(e) => setAllowlistData(prev => ({ ...prev, mintPrice: e.target.value }))} className="w-full bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 rounded px-3 py-2 text-sm" placeholder="0.025" required={showAllowlistStage} disabled={isLoading}/>
                          </div>
                          <div>
                            <label htmlFor="allowlistStageDays" className="block text-xs text-zinc-400 mb-1">Duration (Days)</label>
                            <input type="number" id="allowlistStageDays" value={allowlistData.stageDays} onChange={(e) => setAllowlistData(prev => ({...prev, stageDays: e.target.value}))} className="w-full bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 rounded px-3 py-2 text-sm" placeholder="1" min="0" required={showAllowlistStage} disabled={isLoading}/>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="allowlistAddresses" className="block text-xs text-zinc-400 mb-1">Addresses (one per line)</label>
                          <textarea id="allowlistAddresses" rows={3} value={allowlistData.addresses} onChange={(e) => setAllowlistData(prev => ({ ...prev, addresses: e.target.value }))} className="w-full bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 rounded px-3 py-2 text-sm" placeholder="0x..." required={showAllowlistStage} disabled={isLoading}></textarea>
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50">
                    {isLoading ? 'Creating...' : 'Create Collection'}
                  </button>
  
                  {txHash && (
                    <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400">✅ Collection created successfully!</p>
                      <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-white underline">
                        View transaction
                      </a>
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <NFTCollections />
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <h2 className="text-2xl font-medium text-white mb-4">Connect your wallet to get started</h2>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">Create and mint NFT collections on Ethereum Sepolia testnet</p>
            <button onClick={connectWallet} disabled={isLoading} className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-zinc-100 transition-colors">
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        )}
      </div>
      
      {/* Emergency Debug Component */}
      <EmergencyDebug />
      
      {/* Enhanced User Profile Modal */}
      {showUserProfile && account && (
        <EnhancedUserProfile 
          userAddress={account} 
          onClose={() => setShowUserProfile(false)} 
        />
      )}
    </main>
  );
} 