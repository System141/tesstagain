'use client';

import { useState, useEffect } from 'react';
import { Contract, EventLog, formatEther } from 'ethers';
import { RobustProvider } from './RpcProvider';
import NFTMarketplace from './NFTMarketplace';

const FACTORY_ADDRESS = '0xe553934B8AD246a45785Ea080d53024aAbd39189';
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';

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
  floorPrice?: bigint;
  volume24h?: bigint;
  totalSupply?: number;
  listed?: number;
  change24h?: number;
  featured?: boolean;
}

interface TimeFilter {
  value: '24h' | '7d' | '30d';
  label: string;
}

const TIME_FILTERS: TimeFilter[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' }
];

export default function EnhancedMarketplaceOverview() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'marketplace'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState<'volume' | 'floor' | 'change' | 'listed'>('volume');

  useEffect(() => {
    loadCollections();
    const interval = setInterval(loadCollections, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const robustProvider = RobustProvider.getInstance();
      const provider = await robustProvider.getProvider();
      const currentBlock = await robustProvider.getBlockNumber();

      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const filter = contract.filters.CollectionCreated();
      const fromBlock = Math.max(0, currentBlock - 10000);
      const events = await robustProvider.queryFilter(contract, filter, fromBlock) as EventLog[];

      const collectionsWithData = await Promise.all(
        events
          .filter((event): event is EventLog => 'args' in event && Array.isArray(event.args))
          .map(async (event) => {
            const collection: Collection = {
              address: event.args[0],
              name: event.args[1],
              symbol: event.args[2],
              owner: event.args[3]
            };

            // Mock real-time data for demonstration
            collection.floorPrice = BigInt(Math.floor(Math.random() * 10000000000000000000)); // 0-10 ETH
            collection.volume24h = BigInt(Math.floor(Math.random() * 50000000000000000000)); // 0-50 ETH
            collection.totalSupply = Math.floor(Math.random() * 10000) + 100;
            collection.listed = Math.floor(Math.random() * 100) + 1;
            collection.change24h = (Math.random() - 0.5) * 100; // -50% to +50%
            collection.featured = Math.random() > 0.8; // 20% chance to be featured

            return collection;
          })
      );

      setCollections(collectionsWithData);
    } catch (error) {
      console.error('Error loading collections:', error);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedCollections = collections
    .filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return Number(b.volume24h || 0) - Number(a.volume24h || 0);
        case 'floor':
          return Number(b.floorPrice || 0) - Number(a.floorPrice || 0);
        case 'change':
          return (b.change24h || 0) - (a.change24h || 0);
        case 'listed':
          return (b.listed || 0) - (a.listed || 0);
        default:
          return 0;
      }
    });

  const featuredCollections = collections.filter(c => c.featured).slice(0, 3);

  if (selectedCollection && activeView === 'marketplace') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => {
              setSelectedCollection(null);
              setActiveView('overview');
            }}
            className="text-zinc-400 hover:text-white text-sm mb-4 flex items-center gap-2"
          >
            ← Back to Marketplace
          </button>
          
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {selectedCollection.name}
            </h2>
          </div>
        </div>

        {MARKETPLACE_ADDRESS ? (
          <NFTMarketplace
            collectionAddress={selectedCollection.address}
            collectionName={selectedCollection.name}
            marketplaceAddress={MARKETPLACE_ADDRESS}
          />
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl text-zinc-300 mb-2">Marketplace Contract Not Deployed</h3>
            <p className="text-zinc-500 mb-4">
              Deploy the marketplace contract to enable trading features
            </p>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-md mx-auto">
              <code className="text-sm text-zinc-300">
                npx hardhat run scripts/deploy-marketplace-legacy.js --network sepolia
              </code>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">NFT Marketplace</h1>
        <p className="text-zinc-400 mb-6">
          Discover, trade, and collect NFTs on Ethereum Sepolia
        </p>

        {/* Search and Time Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 pr-10 focus:border-zinc-500 focus:outline-none"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              🔍
            </div>
          </div>

          <div className="flex bg-zinc-800 rounded-lg p-1">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === filter.value
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            ⭐ Featured Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCollections.map((collection) => (
              <div
                key={collection.address}
                className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedCollection(collection);
                  setActiveView('marketplace');
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {collection.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{collection.name}</h3>
                    <p className="text-sm text-purple-300">{collection.symbol}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-400">Floor</p>
                    <p className="text-white font-medium">
                      {collection.floorPrice ? `${parseFloat(formatEther(collection.floorPrice)).toFixed(3)} ETH` : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Volume</p>
                    <p className="text-white font-medium">
                      {collection.volume24h ? `${parseFloat(formatEther(collection.volume24h)).toFixed(1)} ETH` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collections Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Collections</h2>
            <div className="flex gap-2">
              {['volume', 'floor', 'change', 'listed'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort as typeof sortBy)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    sortBy === sort
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading collections...</p>
          </div>
        ) : filteredAndSortedCollections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr className="text-left">
                  <th className="px-6 py-4 text-sm font-medium text-zinc-300">Collection</th>
                  <th className="px-6 py-4 text-sm font-medium text-zinc-300">Floor Price</th>
                  <th className="px-6 py-4 text-sm font-medium text-zinc-300">Volume 24h</th>
                  <th className="px-6 py-4 text-sm font-medium text-zinc-300">Change 24h</th>
                  <th className="px-6 py-4 text-sm font-medium text-zinc-300">Listed</th>
                  <th className="px-6 py-4 text-sm font-medium text-zinc-300">Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCollections.map((collection, index) => (
                  <tr
                    key={collection.address}
                    className="border-t border-zinc-800 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedCollection(collection);
                      setActiveView('marketplace');
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-sm w-6">{index + 1}</span>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {collection.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{collection.name}</p>
                          <p className="text-zinc-400 text-sm">{collection.symbol}</p>
                        </div>
                        {collection.featured && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">
                        {collection.floorPrice ? `${parseFloat(formatEther(collection.floorPrice)).toFixed(3)} ETH` : '--'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">
                        {collection.volume24h ? `${parseFloat(formatEther(collection.volume24h)).toFixed(1)} ETH` : '--'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        (collection.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {collection.change24h ? `${collection.change24h > 0 ? '+' : ''}${collection.change24h.toFixed(1)}%` : '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{collection.listed || '--'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-zinc-400">{collection.totalSupply || '--'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl text-zinc-300 mb-2">No Collections Found</h3>
            <p className="text-zinc-500">
              {searchTerm ? `No collections match "${searchTerm}"` : 'Create your first NFT collection to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Market Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {collections.length}
          </div>
          <div className="text-zinc-400">Total Collections</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {collections.reduce((sum, c) => sum + (c.totalSupply || 0), 0).toLocaleString()}
          </div>
          <div className="text-zinc-400">Total Items</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {parseFloat(formatEther(collections.reduce((sum, c) => sum + (c.volume24h || BigInt(0)), BigInt(0)))).toFixed(1)}
          </div>
          <div className="text-zinc-400">Volume 24h (ETH)</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {collections.reduce((sum, c) => sum + (c.listed || 0), 0).toLocaleString()}
          </div>
          <div className="text-zinc-400">Items Listed</div>
        </div>
      </div>
    </div>
  );
}