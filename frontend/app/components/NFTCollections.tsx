import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, EventLog } from 'ethers';
import NFTCollectionCard from './NFTCollectionCard';

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

export default function NFTCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'popular'>('recent');

  useEffect(() => {
    loadCollections();
    // Refresh collections every 60 seconds
    const interval = setInterval(loadCollections, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort collections
  useEffect(() => {
    let filtered = collections.filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort collections (simplified sorting - in real app would use actual data)
    switch (sortBy) {
      case 'recent':
        // Collections are already in recent order from blockchain events
        break;
      case 'trending':
        // Would sort by volume/activity
        filtered = [...filtered].reverse();
        break;
      case 'popular':
        // Would sort by total mints/holders
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredCollections(filtered);
  }, [collections, searchTerm, sortBy]);

  async function loadCollections() {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      // Scan last 10000 blocks
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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="magic-card p-8 inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="magic-card p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-zinc-200 mb-2">No Collections Yet</h3>
          <p className="text-zinc-400 mb-6">Be the first to create an NFT collection on Jugiter!</p>
          <div className="inline-block px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm">
            Start by clicking &quot;Create Collection&quot; above
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Collections Header with Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">Explore Collections</h2>
          <p className="text-zinc-400">{filteredCollections.length} of {collections.length} collection{collections.length !== 1 ? 's' : ''} {searchTerm && `matching "${searchTerm}"`}</p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="magic-input pl-10 pr-4 py-3 w-full sm:w-80"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setSortBy('recent')}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                sortBy === 'recent' 
                  ? 'bg-violet-600 text-white' 
                  : 'magic-button-secondary'
              }`}
            >
              📅 Recent
            </button>
            <button 
              onClick={() => setSortBy('trending')}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                sortBy === 'trending' 
                  ? 'bg-violet-600 text-white' 
                  : 'magic-button-secondary'
              }`}
            >
              🔥 Trending
            </button>
            <button 
              onClick={() => setSortBy('popular')}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                sortBy === 'popular' 
                  ? 'bg-violet-600 text-white' 
                  : 'magic-button-secondary'
              }`}
            >
              ⭐ Popular
            </button>
          </div>
        </div>
      </div>

      {/* No Results */}
      {filteredCollections.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="magic-card p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">No Results Found</h3>
            <p className="text-zinc-400 mb-6">No collections match &quot;{searchTerm}&quot;</p>
            <button
              onClick={() => setSearchTerm('')}
              className="magic-button-secondary px-6 py-2"
            >
              Clear Search
            </button>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {filteredCollections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCollections.map(collection => (
            <NFTCollectionCard
              key={collection.address}
              address={collection.address}
            />
          ))}
        </div>
      )}
      
      {/* Load More Button */}
      {filteredCollections.length >= 9 && (
        <div className="text-center mt-12">
          <button className="magic-button-secondary px-8 py-3 text-lg">
            Load More Collections
          </button>
        </div>
      )}
    </div>
  );
} 