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
  const [sortBy] = useState<'recent' | 'trending' | 'popular'>('recent');

  useEffect(() => {
    // Set a hard timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('NFTCollections: Force stopping loading after 15 seconds');
      setIsLoading(false);
      setCollections([]);
    }, 15000);

    loadCollections().finally(() => {
      clearTimeout(timeout);
    });

    // Refresh collections every 60 seconds
    const interval = setInterval(loadCollections, 60000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
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
    console.log('NFTCollections: Starting loadCollections...');
    
    if (!window.ethereum) {
      console.log('NFTCollections: No window.ethereum, stopping loading');
      setIsLoading(false);
      return;
    }

    try {
      console.log('NFTCollections: Creating provider...');
      const provider = new BrowserProvider(window.ethereum);
      
      console.log('NFTCollections: Getting current block number...');
      const currentBlock = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Block number timeout')), 5000))
      ]) as number;
      
      console.log('NFTCollections: Current block number:', currentBlock);

      console.log('NFTCollections: Creating contract...');
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      // Use very recent blocks only (last 1000 blocks max)
      const filter = contract.filters.CollectionCreated();
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      console.log('NFTCollections: Scanning blocks from', fromBlock, 'to', currentBlock);
      
      const events = await Promise.race([
        contract.queryFilter(filter, fromBlock),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout after 8 seconds')), 8000))
      ]) as EventLog[];

      console.log('NFTCollections: Raw events found:', events.length);

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

      console.log('NFTCollections: Processed collections:', newCollections.length);
      setCollections(newCollections);
    } catch (error) {
      console.error('NFTCollections: Error loading collections:', error);
      // Always set empty collections and stop loading on any error
      setCollections([]);
    } finally {
      console.log('NFTCollections: Setting loading to false');
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
      {/* Simple Search */}
      <div className="flex justify-center mb-12">
        <div className="relative max-w-md w-full">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCollections.map(collection => (
            <NFTCollectionCard
              key={collection.address}
              address={collection.address}
            />
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
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-xl text-zinc-300 mb-2">No Collections Yet</h3>
          <p className="text-zinc-500">Be the first to create an NFT collection</p>
        </div>
      )}
    </div>
  );
} 