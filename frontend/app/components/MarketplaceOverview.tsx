'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, EventLog } from 'ethers';
import NFTMarketplace from './NFTMarketplace';
import NFTMinter from './NFTMinter';

const FACTORY_ADDRESS = '0xe553934B8AD246a45785Ea080d53024aAbd39189';
const FACTORY_ABI = [
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

interface Collection {
  address: string;
  name: string;
  symbol: string;
  owner?: string;
}

export default function MarketplaceOverview() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'marketplace' | 'mint'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      // Scan last 10000 blocks for events
      const filter = contract.filters.CollectionCreated();
      const events = await contract.queryFilter(filter, -10000);

      const newCollections = events
        .filter((event): event is EventLog => {
          return 'args' in event && Array.isArray(event.args) && event.args.length >= 4;
        })
        .map(event => ({
          address: event.args[0],
          name: event.args[1],
          symbol: event.args[2],
          owner: event.args[3]
        }));

      setCollections(newCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollectionSelect = (collection: Collection, view: 'marketplace' | 'mint') => {
    setSelectedCollection(collection);
    setActiveView(view);
  };

  const handleBackToOverview = () => {
    setSelectedCollection(null);
    setActiveView('overview');
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-zinc-400">Loading collections...</p>
      </div>
    );
  }

  // Show specific collection marketplace or minter
  if (selectedCollection && activeView !== 'overview') {
    return (
      <div>
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={handleBackToOverview}
            className="text-zinc-400 hover:text-white text-sm mb-4"
          >
            ← Back to Marketplace
          </button>
          
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {selectedCollection.name}
            </h2>
            
            <div className="flex bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setActiveView('marketplace')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'marketplace'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Browse & Trade
              </button>
              <button
                onClick={() => setActiveView('mint')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'mint'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mint NFT
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeView === 'marketplace' ? (
          <NFTMarketplace
            collectionAddress={selectedCollection.address}
            collectionName={selectedCollection.name}
          />
        ) : (
          <NFTMinter
            collectionAddress={selectedCollection.address}
            collectionName={selectedCollection.name}
          />
        )}
      </div>
    );
  }

  // Show marketplace overview
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">NFT Marketplace</h2>
        <p className="text-zinc-400 mb-6">
          Discover, trade, and mint NFTs from verified collections on Ethereum Sepolia
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 pr-10 focus:border-zinc-500 focus:outline-none"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map(collection => (
            <div key={collection.address} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                  {collection.name}
                </h3>
                <p className="text-sm text-zinc-400 mb-2">{collection.symbol}</p>
                <p className="text-xs text-zinc-500 truncate">
                  {collection.address}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleCollectionSelect(collection, 'marketplace')}
                  className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-100 transition-colors text-sm"
                >
                  Browse & Trade
                </button>
                
                <button
                  onClick={() => handleCollectionSelect(collection, 'mint')}
                  className="w-full bg-zinc-700 text-white py-2 rounded-lg font-medium hover:bg-zinc-600 transition-colors text-sm"
                >
                  Mint NFT
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Items: --</span>
                  <span>Floor: -- ETH</span>
                  <span>Volume: -- ETH</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searchTerm ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl text-zinc-300 mb-2">No Results</h3>
          <p className="text-zinc-500">No collections match &quot;{searchTerm}&quot;</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 text-zinc-400 hover:text-white underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-2xl text-zinc-300 mb-4">Welcome to the NFT Marketplace</h3>
          <p className="text-zinc-500 mb-8 max-w-md mx-auto">
            Discover unique digital assets, trade with other collectors, and mint your own NFTs from verified collections.
          </p>
          <div className="space-y-4">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-lg mx-auto">
              <h4 className="text-white font-medium mb-2">🚀 Get Started</h4>
              <p className="text-zinc-400 text-sm">
                Create your first NFT collection using the &quot;Create&quot; tab, then come back here to mint and trade individual NFTs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">🖼️</div>
          <h4 className="text-white font-semibold mb-2">Upload & Mint</h4>
          <p className="text-zinc-400 text-sm">
            Upload your images and mint them as NFTs with custom metadata and attributes
          </p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">💱</div>
          <h4 className="text-white font-semibold mb-2">Trade & Collect</h4>
          <p className="text-zinc-400 text-sm">
            Browse collections, discover unique NFTs, and trade directly with other users
          </p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h4 className="text-white font-semibold mb-2">Secure & Verified</h4>
          <p className="text-zinc-400 text-sm">
            All transactions are secured by Ethereum blockchain with verified smart contracts
          </p>
        </div>
      </div>
    </div>
  );
}