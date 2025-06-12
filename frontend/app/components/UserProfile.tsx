import { useState, useEffect } from 'react';
import { Contract, EventLog } from 'ethers';
import { RobustProvider } from './RpcProvider';
import NFTImage from './NFTImage';

interface NFTItem {
  tokenId: string;
  collectionAddress: string;
  collectionName: string;
  tokenUri: string;
}

interface UserProfileProps {
  userAddress: string;
  onClose?: () => void;
}

const NFT_COLLECTION_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)"
];

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

export default function UserProfile({ userAddress, onClose }: UserProfileProps) {
  const [ownedNFTs, setOwnedNFTs] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'owned' | 'created' | 'activity'>('owned');
  const [createdCollections, setCreatedCollections] = useState<{
    address: string;
    name: string;
    symbol: string;
    owner: string;
  }[]>([]);

  useEffect(() => {
    if (userAddress) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, activeTab]);

  async function loadUserData() {
    setIsLoading(true);
    try {
      if (activeTab === 'owned') {
        await loadOwnedNFTs();
      } else if (activeTab === 'created') {
        await loadCreatedCollections();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOwnedNFTs() {
    try {
      const robustProvider = RobustProvider.getInstance();
      const provider = await robustProvider.getProvider();
      
      // Get all collections
      const factoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const currentBlock = await robustProvider.getBlockNumber();
      const filter = factoryContract.filters.CollectionCreated();
      const fromBlock = Math.max(0, currentBlock - 50000); // Increase search range
      
      console.log('UserProfile: Searching for collections from block', fromBlock, 'to', currentBlock);
      const events = await robustProvider.queryFilter(factoryContract, filter, fromBlock) as EventLog[];
      console.log('UserProfile: Found', events.length, 'collection events');

      const nfts: NFTItem[] = [];

      // Check each collection for owned NFTs
      for (const event of events) {
        if ('args' in event && Array.isArray(event.args)) {
          const collectionAddress = event.args[0];
          const collectionName = event.args[1];
          
          console.log('UserProfile: Checking collection', collectionName, 'at', collectionAddress);
          
          try {
            const collectionContract = new Contract(collectionAddress, NFT_COLLECTION_ABI, provider);
            
            // Check if contract has totalSupply (means it has minted NFTs)
            let totalSupply;
            try {
              totalSupply = await collectionContract.totalSupply();
              console.log('UserProfile: Collection', collectionName, 'has total supply:', totalSupply.toString());
            } catch {
              console.log('UserProfile: Collection', collectionName, 'has no totalSupply function, skipping');
              continue;
            }
            
            if (totalSupply > BigInt(0)) {
              // Check user's balance in this collection
              const balance = await collectionContract.balanceOf(userAddress);
              console.log('UserProfile: User balance in', collectionName, ':', balance.toString());
              
              if (balance > BigInt(0)) {
                // Method 1: Try tokenOfOwnerByIndex (if supported)
                let tokensFound = false;
                try {
                  for (let i = 0; i < Number(balance); i++) {
                    const tokenId = await collectionContract.tokenOfOwnerByIndex(userAddress, i);
                    const tokenUri = await collectionContract.tokenURI(tokenId);
                    
                    console.log('UserProfile: Found NFT', tokenId.toString(), 'in', collectionName);
                    
                    nfts.push({
                      tokenId: tokenId.toString(),
                      collectionAddress,
                      collectionName,
                      tokenUri
                    });
                  }
                  tokensFound = true;
                } catch {
                  console.log('UserProfile: tokenOfOwnerByIndex not supported, trying manual check');
                }
                
                // Method 2: Manual check if enumeration not supported
                if (!tokensFound) {
                  for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
                    try {
                      const owner = await collectionContract.ownerOf(tokenId);
                      if (owner.toLowerCase() === userAddress.toLowerCase()) {
                        const tokenUri = await collectionContract.tokenURI(tokenId);
                        
                        console.log('UserProfile: Found NFT', tokenId, 'in', collectionName, 'via manual check');
                        
                        nfts.push({
                          tokenId: tokenId.toString(),
                          collectionAddress,
                          collectionName,
                          tokenUri
                        });
                      }
                    } catch {
                      // Token might not exist, continue
                      continue;
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('UserProfile: Error checking collection:', collectionAddress, err);
          }
        }
      }

      console.log('UserProfile: Total NFTs found:', nfts.length);
      setOwnedNFTs(nfts);
    } catch (error) {
      console.error('UserProfile: Error loading owned NFTs:', error);
      setOwnedNFTs([]);
    }
  }

  async function loadCreatedCollections() {
    try {
      const robustProvider = RobustProvider.getInstance();
      const provider = await robustProvider.getProvider();
      
      const factoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const currentBlock = await robustProvider.getBlockNumber();
      const filter = factoryContract.filters.CollectionCreated(null, null, null, userAddress);
      const fromBlock = Math.max(0, currentBlock - 10000);
      const events = await robustProvider.queryFilter(factoryContract, filter, fromBlock) as EventLog[];

      const collections = events
        .filter((event): event is EventLog => {
          return 'args' in event && Array.isArray(event.args) && event.args.length >= 4;
        })
        .map(event => ({
          address: event.args[0],
          name: event.args[1],
          symbol: event.args[2],
          owner: event.args[3]
        }));

      setCreatedCollections(collections);
    } catch (error) {
      console.error('Error loading created collections:', error);
      setCreatedCollections([]);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">User Profile</h2>
            <p className="text-sm text-zinc-400">
              {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800">
          <div className="flex">
            <button
              onClick={() => setActiveTab('owned')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'owned'
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Owned NFTs ({ownedNFTs.length})
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'created'
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Created Collections ({createdCollections.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading...</p>
            </div>
          ) : (
            <>
              {/* Owned NFTs Tab */}
              {activeTab === 'owned' && (
                <div>
                  {ownedNFTs.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {ownedNFTs.map((nft, index) => (
                        <div key={index} className="bg-zinc-800 rounded-lg overflow-hidden">
                          <div className="aspect-square bg-zinc-700">
                            <NFTImage
                              tokenUri={nft.tokenUri}
                              alt={`${nft.collectionName} #${nft.tokenId}`}
                              className="w-full h-full object-cover"
                              width={200}
                              height={200}
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-zinc-400 truncate">{nft.collectionName}</p>
                            <p className="text-sm font-medium text-white">#{nft.tokenId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🖼️</div>
                      <p className="text-zinc-400">No NFTs owned yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Created Collections Tab */}
              {activeTab === 'created' && (
                <div>
                  {createdCollections.length > 0 ? (
                    <div className="space-y-4">
                      {createdCollections.map((collection, index) => (
                        <div key={index} className="bg-zinc-800 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <h4 className="text-lg font-medium text-white">{collection.name}</h4>
                            <p className="text-sm text-zinc-400">{collection.symbol}</p>
                            <p className="text-xs text-zinc-500 mt-1">{collection.address}</p>
                          </div>
                          <a
                            href={`https://sepolia.etherscan.io/address/${collection.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                          >
                            View on Etherscan →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎨</div>
                      <p className="text-zinc-400">No collections created yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-zinc-400">Activity tracking coming soon</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}