'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, parseEther, ethers } from 'ethers';
import NFTCollections from './components/NFTCollections';
import ImageTest from './components/ImageTest';
import NetworkTest from './components/NetworkTest';
import ImageUploader from './components/ImageUploader';

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
  const [activeTab, setActiveTab] = useState<'create' | 'mint'>('mint');
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

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      const publicMintPrice = parseEther(formData.mintPrice || "0");
      const maxSupply = BigInt(formData.maxSupply || "0");
      const maxPerWallet = BigInt(formData.maxPerWallet || "0");
      const royaltyBps = Math.floor(parseFloat(formData.royaltyPercentage || "0") * 100);
      if (royaltyBps < 0 || royaltyBps > 10000) {
        alert("Royalty percentage must be between 0 and 100 (e.g., 2.5 for 2.5%).");
        setIsLoading(false);
        return;
      }

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
        const maxPerAllowlistWallet = maxPerWallet; // Or a new field from allowlistData if desired

        if (allowlistAddresses.length === 0 && allowlistDurationSeconds > 0 && allowlistData.addresses.trim() !== '') {
            alert("Allowlist is active but no valid addresses were provided or addresses are invalid. Please check the format (0x...).");
            setIsLoading(false);
            return;
        }
         if (allowlistDurationSeconds > 0 && !allowlistData.mintPrice) {
            alert("Please set a mint price for the allowlist stage if duration is greater than 0.");
            setIsLoading(false);
            return;
        }

        tx = await contract.createCollection(
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
        );
      } else {
        tx = await contract.createCollection(
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
        );
      }

      const receipt = await tx.wait();
      if (receipt && receipt.status === 1) {
        setTxHash(tx.hash);
        alert('Collection created successfully! Transaction Hash: ' + tx.hash);
        // Reset form (optional)
        setFormData({ name: '', symbol: '', baseURI: '', maxSupply: '', mintPrice: '', maxPerWallet: '', royaltyPercentage: '' });
        setShowAllowlistStage(false);
        setAllowlistData({ mintPrice: '', stageDays: '1', stageHours: '0', addresses: '' });
      } else {
        alert('Transaction failed or was reverted. Check the console for details.');
      }
    } catch (error: unknown) {
      console.error('Error creating collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error. Check console.';
      alert(`An error occurred during collection creation: ${errorMessage}`);
    }
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-violet-900/20 to-cyan-900/20 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Jugiter</h1>
              <p className="text-zinc-400 text-lg">Launch your NFT collection on Ethereum</p>
            </div>
            <button
              onClick={connectWallet}
              className="magic-button disabled:opacity-70"
              disabled={isLoading || isConnected}
            >
              {isConnected ? `${account.slice(0, 6)}...${account.slice(-4)}` : (isLoading ? 'Connecting...': 'Connect Wallet')}
            </button>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="magic-card p-4 text-center">
              <p className="text-2xl font-bold text-violet-400">12</p>
              <p className="text-sm text-zinc-400">Collections</p>
            </div>
            <div className="magic-card p-4 text-center">
              <p className="text-2xl font-bold text-cyan-400">2.4K</p>
              <p className="text-sm text-zinc-400">NFTs Minted</p>
            </div>
            <div className="magic-card p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">156</p>
              <p className="text-sm text-zinc-400">Creators</p>
            </div>
            <div className="magic-card p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">45.2 ETH</p>
              <p className="text-sm text-zinc-400">Volume</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-6 mb-8 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('mint')}
            className={`px-6 py-4 font-semibold text-lg transition-all duration-200 border-b-2 ${
              activeTab === 'mint'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-violet-400'
            }`}
          >
            Explore Collections
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-4 font-semibold text-lg transition-all duration-200 border-b-2 ${
              activeTab === 'create'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-violet-400'
            }`}
          >
            Create Collection
          </button>
        </div>

        {isConnected ? (
          <>

            {activeTab === 'create' ? (
              <form onSubmit={handleSubmit} className="space-y-8 magic-card p-8 rounded-xl shadow-2xl">
                <div>
                    <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Collection Details</h2>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Collection Name</label>
                        <input type="text" id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="magic-input w-full" placeholder="My Awesome Collection" required disabled={isLoading}/>
                    </div>
                    <div>
                        <label htmlFor="symbol" className="block text-sm font-medium text-zinc-300 mb-2">Symbol</label>
                        <input type="text" id="symbol" value={formData.symbol} onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))} className="magic-input w-full" placeholder="MAC" required disabled={isLoading}/>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="baseURI" className="block text-sm font-medium text-zinc-300 mb-2">Base URI (for metadata)</label>
                    <input type="text" id="baseURI" value={formData.baseURI} onChange={(e) => setFormData(prev => ({ ...prev, baseURI: e.target.value }))} className="magic-input w-full" placeholder="ipfs://Your CID Here/" required disabled={isLoading}/>
                    <p className="mt-2 text-xs text-zinc-500">Must start with &apos;ipfs://&apos; and end with &apos;/&apos;. Metadata files should be named 1.json, 2.json, etc.</p>
                    <div className="mt-2">
                         <ImageUploader 
                            onUploadComplete={(baseURI: string) => setFormData(prev => ({ ...prev, baseURI: baseURI }))} 
                            nftStorageKey={process.env.NEXT_PUBLIC_NFT_STORAGE_KEY || ""}
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="maxSupply" className="block text-sm font-medium text-zinc-300 mb-2">Max Supply</label>
                        <input type="number" id="maxSupply" value={formData.maxSupply} onChange={(e) => setFormData(prev => ({ ...prev, maxSupply: e.target.value }))} className="magic-input w-full" placeholder="1000" required min="1" disabled={isLoading}/>
                    </div>
                    <div>
                        <label htmlFor="mintPrice" className="block text-sm font-medium text-zinc-300 mb-2">Public Mint Price (ETH)</label>
                        <input type="text" id="mintPrice" value={formData.mintPrice} onChange={(e) => setFormData(prev => ({ ...prev, mintPrice: e.target.value }))} className="magic-input w-full" placeholder="0.05" required disabled={isLoading}/>
                    </div>
                     <div>
                        <label htmlFor="maxPerWallet" className="block text-sm font-medium text-zinc-300 mb-2">Max Per Wallet (Public)</label>
                        <input type="number" id="maxPerWallet" value={formData.maxPerWallet} onChange={(e) => setFormData(prev => ({ ...prev, maxPerWallet: e.target.value }))} className="magic-input w-full" placeholder="5" required min="1" disabled={isLoading}/>
                    </div>
                  </div>
                   <div>
                        <label htmlFor="royaltyPercentage" className="block text-sm font-medium text-zinc-300 mb-2">Royalty Percentage (%)</label>
                        <input type="number" id="royaltyPercentage" value={formData.royaltyPercentage} onChange={(e) => setFormData(prev => ({ ...prev, royaltyPercentage: e.target.value }))} className="magic-input w-full" placeholder="e.g., 2.5 (for 2.5%)" step="0.1" min="0" max="100" disabled={isLoading}/>
                        <p className="mt-2 text-xs text-zinc-500">Commission on secondary sales. Enter 2.5 for 2.5%.</p>
                    </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Allowlist Phase (Optional)</h3>
                      <button type="button" onClick={() => setShowAllowlistStage(!showAllowlistStage)} className={`magic-button-secondary ${showAllowlistStage ? '!bg-red-500/20 !text-red-400 hover:!bg-red-500/30' : ''}`} disabled={isLoading}>
                        {showAllowlistStage ? 'Disable Allowlist Phase' : 'Enable Allowlist Phase'}
                      </button>
                    </div>
                    {showAllowlistStage && (
                      <div className="mt-4 space-y-6 p-6 bg-slate-50 rounded-lg border">
                        <div>
                          <label htmlFor="allowlistMintPrice" className="block text-sm font-medium text-zinc-300 mb-2">Allowlist Mint Price (ETH)</label>
                          <input type="text" id="allowlistMintPrice" value={allowlistData.mintPrice} onChange={(e) => setAllowlistData(prev => ({ ...prev, mintPrice: e.target.value }))} className="magic-input w-full" placeholder="0.025" required={showAllowlistStage} disabled={isLoading}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="allowlistStageDays" className="block text-sm font-medium text-zinc-300 mb-2">Duration (Days)</label>
                                <input type="number" id="allowlistStageDays" value={allowlistData.stageDays} onChange={(e) => setAllowlistData(prev => ({...prev, stageDays: e.target.value}))} className="magic-input w-full" placeholder="1" min="0" required={showAllowlistStage} disabled={isLoading}/>
                            </div>
                            <div>
                                <label htmlFor="allowlistStageHours" className="block text-sm font-medium text-zinc-300 mb-2">Duration (Hours)</label>
                                <input type="number" id="allowlistStageHours" value={allowlistData.stageHours} onChange={(e) => setAllowlistData(prev => ({...prev, stageHours: e.target.value}))} className="magic-input w-full" placeholder="0" min="0" max="23" required={showAllowlistStage} disabled={isLoading}/>
                            </div>
                        </div>
                        <div>
                          <label htmlFor="allowlistAddresses" className="block text-sm font-medium text-zinc-300 mb-2">Allowlisted Addresses</label>
                          <textarea id="allowlistAddresses" rows={4} value={allowlistData.addresses} onChange={(e) => setAllowlistData(prev => ({ ...prev, addresses: e.target.value }))} className="magic-input w-full" placeholder="Enter addresses separated by commas, spaces, or new lines." required={showAllowlistStage} disabled={isLoading}></textarea>
                          <p className="mt-2 text-xs text-zinc-500">Provide a list of Ethereum addresses. Invalid addresses will be ignored.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full magic-button text-lg py-3">
                    {isLoading ? 'Processing...' : 'Create Collection'}
                  </button>
  
                  {txHash && (
                    <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-700">Transaction Successful!</p>
                          <p className="text-sm text-green-600">Hash: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">{txHash}</a></p>
                        </div>
                      </div>
                    </div>
                  )}
              </form>
            ) : (
              <NFTCollections />
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-3xl font-semibold text-white mb-6">Welcome to Jugiter!</h2>
            <p className="text-zinc-300 mb-8 max-w-md mx-auto">Connect your wallet to mint NFTs or create your own NFT collection. This platform runs on the Sepolia test network.</p>
            <button onClick={connectWallet} disabled={isLoading} className="magic-button text-lg px-8 py-3.5">
              {isLoading ? 'Connecting Wallet...' : 'Connect Your Wallet'}
            </button>
            <p className="mt-6 text-sm text-zinc-400">Please ensure MetaMask is installed and unlocked.</p>
          </div>
        )}
      </div>
      
      {/* Image Test Component */}
      <ImageTest />
      
      {/* Network Test Component */}
      <NetworkTest />
    </main>
  );
} 