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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollections();
    // Refresh collections every 60 seconds
    const interval = setInterval(loadCollections, 60000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Collections Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Live Collections</h2>
          <p className="text-zinc-400">{collections.length} collection{collections.length !== 1 ? 's' : ''} available for minting</p>
        </div>
        <div className="flex gap-2">
          <button className="magic-button-secondary px-4 py-2 text-sm">
            🔥 Trending
          </button>
          <button className="magic-button-secondary px-4 py-2 text-sm">
            📅 Recent
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {collections.map(collection => (
          <NFTCollectionCard
            key={collection.address}
            address={collection.address}
          />
        ))}
      </div>
      
      {/* Load More Button */}
      {collections.length >= 6 && (
        <div className="text-center mt-12">
          <button className="magic-button-secondary px-8 py-3">
            Load More Collections
          </button>
        </div>
      )}
    </div>
  );
} 