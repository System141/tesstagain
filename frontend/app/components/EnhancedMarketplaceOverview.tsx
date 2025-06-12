'use client';

import { useState, useEffect } from 'react';
import { Contract, EventLog, formatEther } from 'ethers';
import { RobustProvider } from './RpcProvider';
import NFTMarketplace from './NFTMarketplace';

const FACTORY_ADDRESS = '0xe553934B8AD246a45785Ea080d53024aAbd39189';
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';

const MARKETPLACE_ABI = [
  "function listings(uint256) view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool active)",
  "function nextListingId() view returns (uint256)",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)",
  "event Sale(uint256 indexed listingId, address indexed buyer, address indexed seller, address nftContract, uint256 tokenId, uint256 price)"
] as const;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadMarketplaceStats(collectionAddress: string, provider: any) {
  try {
    const marketplaceContract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 2000); // Last 2000 blocks for recent activity
    
    // Get active listings for this collection
    const listingFilter = marketplaceContract.filters.ListingCreated(null, null, collectionAddress);
    const listingEvents = await provider.getLogs({
      ...listingFilter,
      fromBlock
    });
    
    // Get sales for volume calculation
    const saleFilter = marketplaceContract.filters.Sale(null, null, null, collectionAddress);
    const saleEvents = await provider.getLogs({
      ...saleFilter,
      fromBlock
    });
    
    let floorPrice = BigInt(0);
    let listed = 0;
    let volume24h = BigInt(0);
    
    // Check active listings and find floor price
    const activePrices: bigint[] = [];
    for (const event of listingEvents) {
      try {
        const decoded = marketplaceContract.interface.parseLog(event);
        if (decoded && decoded.args) {
          const listingId = decoded.args[0];
          const [, nftContract, , price, active] = await marketplaceContract.listings(listingId);
          
          if (active && nftContract.toLowerCase() === collectionAddress.toLowerCase()) {
            activePrices.push(price);
            listed++;
          }
        }
      } catch (error) {
        console.error('Error processing listing event:', error);
      }
    }
    
    // Calculate floor price
    if (activePrices.length > 0) {
      floorPrice = activePrices.reduce((min, price) => price < min ? price : min, activePrices[0]);
    }
    
    // Calculate 24h volume from sales
    for (const event of saleEvents) {
      try {
        const decoded = marketplaceContract.interface.parseLog(event);
        if (decoded && decoded.args) {
          volume24h += decoded.args[5]; // price from sale event
        }
      } catch (error) {
        console.error('Error processing sale event:', error);
      }
    }
    
    return {
      floorPrice,
      volume24h,
      listed,
      change24h: 0 // Would need historical data to calculate change
    };
  } catch (error) {
    console.error('Error loading marketplace stats:', error);
    return {
      floorPrice: BigInt(0),
      volume24h: BigInt(0),
      listed: 0,
      change24h: 0
    };
  }
}

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
    // More frequent updates for real-time feel - every 30 seconds
    const interval = setInterval(loadCollections, 30000);
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

            // Load real collection data from blockchain
            try {
              const collectionContract = new (await import('ethers')).Contract(
                collection.address, 
                ['function totalSupply() view returns (uint256)'], 
                provider
              );
              
              collection.totalSupply = Number(await collectionContract.totalSupply());
              
              // Load marketplace data if marketplace address is available
              if (MARKETPLACE_ADDRESS) {
                const marketplaceStats = await loadMarketplaceStats(collection.address, provider);
                collection.floorPrice = marketplaceStats.floorPrice;
                collection.volume24h = marketplaceStats.volume24h;
                collection.listed = marketplaceStats.listed;
                collection.change24h = marketplaceStats.change24h;
                collection.featured = marketplaceStats.volume24h > BigInt(5000000000000000000); // Featured if volume > 5 ETH
              } else {
                collection.floorPrice = BigInt(0);
                collection.volume24h = BigInt(0);
                collection.listed = 0;
                collection.change24h = 0;
                collection.featured = false;
              }
            } catch (error) {
              console.error(`Error loading data for collection ${collection.name}:`, error);
              collection.totalSupply = 0;
              collection.floorPrice = BigInt(0);
              collection.volume24h = BigInt(0);
              collection.listed = 0; 
              collection.change24h = 0;
              collection.featured = false;
            }

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
    <div className="space-y-6">
      {/* Magic Eden Style Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Ethereum NFT Market</h1>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Total Volume</span>
                <span className="text-white font-medium">
                  {parseFloat(formatEther(collections.reduce((sum, c) => sum + (c.volume24h || BigInt(0)), BigInt(0)))).toFixed(1)} ETH
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Total Sales</span>
                <span className="text-white font-medium">
                  {collections.reduce((sum, c) => sum + (c.listed || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex bg-zinc-900 rounded-lg p-1">
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

        {/* Advanced Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-400 rounded-lg px-4 py-3 pr-10 focus:border-purple-500 focus:outline-none text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex gap-2">
            <select className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:border-purple-500 focus:outline-none">
              <option value="">All Blockchains</option>
              <option value="ethereum">Ethereum</option>
              <option value="sepolia">Sepolia (Test)</option>
            </select>
            
            <select className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:border-purple-500 focus:outline-none">
              <option value="">All Categories</option>
              <option value="art">Art</option>
              <option value="gaming">Gaming</option>
              <option value="pfp">PFP</option>
              <option value="utility">Utility</option>
            </select>
          </div>
        </div>
      </div>

      {/* Featured Collections Carousel - Magic Eden Style */}
      {featuredCollections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-yellow-400">⭐</span>
              Featured
            </h2>
            <button className="text-sm text-zinc-400 hover:text-white transition-colors">
              View all →
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth">
            {featuredCollections.map((collection) => (
              <div
                key={collection.address}
                className="flex-shrink-0 w-80 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedCollection(collection);
                  setActiveView('marketplace');
                }}
              >
                {/* Collection Banner */}
                <div className="h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                      Featured
                    </span>
                  </div>
                </div>

                {/* Collection Info */}
                <div className="p-4 -mt-8 relative">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl border-4 border-zinc-900">
                      {collection.name.charAt(0)}
                    </div>
                    <div className="flex-1 mt-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-zinc-400">{collection.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Floor Price</p>
                      <p className="text-white font-semibold">
                        {collection.floorPrice ? `${parseFloat(formatEther(collection.floorPrice)).toFixed(3)} ETH` : '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">24h Volume</p>
                      <p className="text-white font-semibold">
                        {collection.volume24h ? `${parseFloat(formatEther(collection.volume24h)).toFixed(1)} ETH` : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Collections and Collection Tabs */}
      <div className="space-y-4">
        {/* Tab Navigation - Responsive */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 lg:pb-0">
            <button className="flex items-center gap-2 text-white font-medium whitespace-nowrap">
              <span className="text-yellow-400">⭐</span>
              Top
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors font-medium whitespace-nowrap">
              Memecoin NFTs
            </button>
          </div>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
            <span className="text-zinc-400 text-sm hidden sm:block">Sort by:</span>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {['volume', 'floor', 'change', 'listed'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort as typeof sortBy)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === sort
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Collections Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {isLoading ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            </div>
            <p className="text-zinc-400">Loading latest market data...</p>
          </div>
        ) : filteredAndSortedCollections.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
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
                      <div className="flex items-center gap-3">
                        <span className={`font-medium ${
                          (collection.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {collection.change24h ? `${collection.change24h > 0 ? '+' : ''}${collection.change24h.toFixed(1)}%` : '--'}
                        </span>
                        {/* Mini Chart */}
                        <div className="w-16 h-8 relative">
                          <svg width="64" height="32" className="overflow-visible">
                            <path
                              d={`M 0 ${16 + (Math.sin(index * 0.5) * 6)} L 16 ${16 + (Math.sin((index + 1) * 0.5) * 6)} L 32 ${16 + (Math.sin((index + 2) * 0.5) * 6)} L 48 ${16 + (Math.sin((index + 3) * 0.5) * 6)} L 64 ${16 + (Math.sin((index + 4) * 0.5) * 6)}`}
                              stroke={(collection.change24h || 0) >= 0 ? '#10b981' : '#ef4444'}
                              strokeWidth="2"
                              fill="none"
                              className="drop-shadow-sm"
                            />
                          </svg>
                        </div>
                      </div>
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredAndSortedCollections.map((collection, index) => (
              <div
                key={collection.address}
                className="bg-zinc-800/30 rounded-lg p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedCollection(collection);
                  setActiveView('marketplace');
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 text-sm w-6">{index + 1}</span>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {collection.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{collection.name}</p>
                      <p className="text-zinc-400 text-xs">{collection.symbol}</p>
                    </div>
                  </div>
                  {collection.featured && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                      Featured
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Floor Price</p>
                    <p className="text-white font-medium">
                      {collection.floorPrice ? `${parseFloat(formatEther(collection.floorPrice)).toFixed(3)} ETH` : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Volume 24h</p>
                    <p className="text-white font-medium">
                      {collection.volume24h ? `${parseFloat(formatEther(collection.volume24h)).toFixed(1)} ETH` : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Change 24h</p>
                    <span className={`font-medium ${
                      (collection.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {collection.change24h ? `${collection.change24h > 0 ? '+' : ''}${collection.change24h.toFixed(1)}%` : '--'}
                    </span>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Items</p>
                    <p className="text-zinc-400">{collection.totalSupply || '--'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
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