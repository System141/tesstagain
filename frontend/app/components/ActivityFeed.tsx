import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';

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

// Simplified Transfer event ABI for any NFT contract
const TRANSFER_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  }
] as const;

interface ActivityItem {
  id: string;
  type: 'collection_created' | 'nft_minted';
  timestamp: Date;
  collectionAddress?: string;
  collectionName?: string;
  tokenId?: number;
  userAddress?: string;
  txHash?: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
    const interval = setInterval(loadRecentActivity, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadRecentActivity() {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const factoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      // Get recent collection creation events
      const collectionEvents = await factoryContract.queryFilter(
        factoryContract.filters.CollectionCreated(),
        -2000 // Last 2000 blocks
      );

      const recentActivities: ActivityItem[] = [];

      // Process collection creation events
      for (const event of collectionEvents.slice(-10)) { // Take last 10 events
        if ('args' in event && Array.isArray(event.args)) {
          const block = await provider.getBlock(event.blockNumber);
          recentActivities.push({
            id: `collection-${event.blockNumber}-${event.transactionIndex}`,
            type: 'collection_created',
            timestamp: new Date(block!.timestamp * 1000),
            collectionAddress: event.args[0],
            collectionName: event.args[1],
            userAddress: event.args[3],
            txHash: event.transactionHash
          });
        }
      }

      // Try to get some NFT mint events from known collections
      for (const collectionEvent of collectionEvents.slice(-5)) {
        if ('args' in collectionEvent && Array.isArray(collectionEvent.args)) {
          try {
            const collectionContract = new Contract(
              collectionEvent.args[0],
              TRANSFER_ABI,
              provider
            );

            const mintEvents = await collectionContract.queryFilter(
              collectionContract.filters.Transfer(
                '0x0000000000000000000000000000000000000000',
                null,
                null
              ),
              -1000 // Last 1000 blocks for this collection
            );

            // Add recent mints from this collection
            for (const mintEvent of mintEvents.slice(-3)) { // Take last 3 mints
              if ('args' in mintEvent && Array.isArray(mintEvent.args)) {
                const block = await provider.getBlock(mintEvent.blockNumber);
                recentActivities.push({
                  id: `mint-${mintEvent.blockNumber}-${mintEvent.transactionIndex}`,
                  type: 'nft_minted',
                  timestamp: new Date(block!.timestamp * 1000),
                  collectionAddress: collectionEvent.args[0],
                  collectionName: collectionEvent.args[1],
                  tokenId: Number(mintEvent.args[2]),
                  userAddress: mintEvent.args[1],
                  txHash: mintEvent.transactionHash
                });
              }
            }
          } catch (error) {
            // Skip collections that don't support Transfer events or have other issues
            console.debug(`Skipping mint events for collection ${collectionEvent.args[0]}:`, error);
          }
        }
      }

      // Sort by timestamp (newest first) and take top 20
      const sortedActivities = recentActivities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error loading activity feed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  function truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  if (isLoading) {
    return (
      <div className="magic-card p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-zinc-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-zinc-700 rounded mb-1"></div>
                <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="magic-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-zinc-100">Live Activity</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-zinc-400">Live</span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          <div className="text-4xl mb-2">🌟</div>
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 xl:max-h-screen overflow-y-auto custom-scrollbar">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                activity.type === 'collection_created' 
                  ? 'bg-violet-500/20 text-violet-400' 
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {activity.type === 'collection_created' ? '🎨' : '⚡'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-zinc-200 font-medium">
                    {truncateAddress(activity.userAddress || '')}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {activity.type === 'collection_created' ? 'created collection' : 'minted NFT #' + activity.tokenId}
                  </span>
                  <span className="text-sm text-violet-400 font-medium truncate">
                    {activity.collectionName}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-zinc-500">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                  {activity.txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${activity.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                    >
                      View Tx
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <button className="magic-button-secondary w-full text-sm py-2">
          View All Activity
        </button>
      </div>
    </div>
  );
}