'use client';

import { useState, useEffect } from 'react';
import { Contract, EventLog } from 'ethers';
import EnhancedMarketplace from './EnhancedMarketplace';
import NFTMarketplace from './NFTMarketplace';
import { RobustProvider } from './RpcProvider';

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

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';

export default function MarketplaceOverview() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'marketplace'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Set a hard timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('MarketplaceOverview: Force stopping loading after 15 seconds');
      setIsLoading(false);
      setCollections([]);
    }, 15000);

    loadCollections().finally(() => {
      clearTimeout(timeout);
    });

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  async function loadCollections() {
    console.log('MarketplaceOverview: Starting loadCollections...');

    try {
      const robustProvider = RobustProvider.getInstance();
      
      console.log('MarketplaceOverview: Getting robust provider...');
      const provider = await robustProvider.getProvider();
      
      console.log('MarketplaceOverview: Getting current block number...');
      const currentBlock = await robustProvider.getBlockNumber();
      
      console.log('MarketplaceOverview: Current block number:', currentBlock);

      console.log('MarketplaceOverview: Creating contract...');
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      // Use very recent blocks only (last 500 blocks max)
      const filter = contract.filters.CollectionCreated();
      const fromBlock = Math.max(0, currentBlock - 500);
      
      console.log('MarketplaceOverview: Scanning blocks from', fromBlock, 'to', currentBlock);
      
      const events = await robustProvider.queryFilter(contract, filter, fromBlock) as EventLog[];

      console.log('MarketplaceOverview: Raw events found:', events.length);

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

      console.log('MarketplaceOverview: Processed collections:', newCollections.length);
      setCollections(newCollections);
    } catch (error) {
      console.error('MarketplaceOverview: Error loading collections:', error);
      // Always set empty collections and stop loading on any error
      setCollections([]);
    } finally {
      console.log('MarketplaceOverview: Setting loading to false');
      setIsLoading(false);
    }
  }

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setActiveView('marketplace');
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
            
          </div>
        </div>

        {/* Content */}
        {MARKETPLACE_ADDRESS ? (
          <NFTMarketplace
            collectionAddress={selectedCollection.address}
            collectionName={selectedCollection.name}
            marketplaceAddress={MARKETPLACE_ADDRESS}
          />
        ) : (
          <EnhancedMarketplace
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
                  onClick={() => handleCollectionSelect(collection)}
                  className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-100 transition-colors text-sm"
                >
                  View Collection
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
            Discover unique digital assets from verified collections on Ethereum Sepolia testnet.
          </p>
          <div className="space-y-4">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-lg mx-auto">
              <h4 className="text-white font-medium mb-2">🚀 Get Started</h4>
              <p className="text-zinc-400 text-sm">
                Create your first NFT collection using the &quot;Create&quot; tab, then come back here to view and explore your collections.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">🖼️</div>
          <h4 className="text-white font-semibold mb-2">View Collections</h4>
          <p className="text-zinc-400 text-sm">
            Browse verified NFT collections and explore unique digital assets from creators
          </p>
        </div>
        
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">⚡</div>
          <h4 className="text-white font-semibold mb-2">Fast & Reliable</h4>
          <p className="text-zinc-400 text-sm">
            Built on Ethereum Sepolia testnet with IPFS storage for optimal performance
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