import { useState, useEffect } from 'react';
import { Contract, EventLog, BrowserProvider } from 'ethers';
import { UserProfileManager, UserProfileData, UserActivity } from '../utils/userProfile';
import NFTImage from './NFTImage';

interface NFTItem {
  tokenId: string;
  collectionAddress: string;
  collectionName: string;
  tokenUri: string;
}

interface EnhancedUserProfileProps {
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

export default function EnhancedUserProfile({ userAddress, onClose }: EnhancedUserProfileProps) {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [ownedNFTs, setOwnedNFTs] = useState<NFTItem[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'owned' | 'created' | 'activity' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfileData>>({});
  const [createdCollections, setCreatedCollections] = useState<{
    address: string;
    name: string;
    symbol: string;
    owner: string;
  }[]>([]);

  useEffect(() => {
    if (userAddress) {
      initializeProfile();
      loadUserData();
    }
  }, [userAddress, activeTab]);

  function initializeProfile() {
    let profile = UserProfileManager.getProfile(userAddress);
    if (!profile) {
      profile = UserProfileManager.createDefaultProfile(userAddress);
      UserProfileManager.saveProfile(profile);
    }
    setUserProfile(profile);
    setEditForm(profile);
    
    const activity = UserProfileManager.getActivity(userAddress);
    setUserActivity(activity);
  }

  async function loadUserData() {
    setIsLoading(true);
    try {
      if (activeTab === 'owned') {
        await loadOwnedNFTs();
      } else if (activeTab === 'created') {
        await loadCreatedCollections();
      }
      
      // Update stats
      await updateProfileStats();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProfileStats() {
    try {
      const ownedCount = ownedNFTs.length;
      const createdCount = createdCollections.length;
      
      UserProfileManager.updateStats(userAddress, {
        nftsOwned: ownedCount,
        collectionsCreated: createdCount
      });
      
      // Refresh profile with updated stats
      const updatedProfile = UserProfileManager.getProfile(userAddress);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  async function loadOwnedNFTs() {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet detected');
      }
      const provider = new BrowserProvider(window.ethereum);
      
      const factoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const currentBlock = await provider.getBlockNumber();
      const filter = factoryContract.filters.CollectionCreated();
      const fromBlock = Math.max(0, currentBlock - 50000);
      
      const events = await factoryContract.queryFilter(filter, fromBlock) as EventLog[];
      const nfts: NFTItem[] = [];

      for (const event of events) {
        if ('args' in event && Array.isArray(event.args)) {
          const collectionAddress = event.args[0];
          const collectionName = event.args[1];
          
          try {
            const collectionContract = new Contract(collectionAddress, NFT_COLLECTION_ABI, provider);
            
            let totalSupply;
            try {
              totalSupply = await collectionContract.totalSupply();
            } catch {
              continue;
            }
            
            if (totalSupply > BigInt(0)) {
              const balance = await collectionContract.balanceOf(userAddress);
              
              if (balance > BigInt(0)) {
                try {
                  for (let i = 0; i < Number(balance); i++) {
                    const tokenId = await collectionContract.tokenOfOwnerByIndex(userAddress, i);
                    const tokenUri = await collectionContract.tokenURI(tokenId);
                    
                    nfts.push({
                      tokenId: tokenId.toString(),
                      collectionAddress,
                      collectionName,
                      tokenUri
                    });
                  }
                } catch {
                  for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
                    try {
                      const owner = await collectionContract.ownerOf(tokenId);
                      if (owner.toLowerCase() === userAddress.toLowerCase()) {
                        const tokenUri = await collectionContract.tokenURI(tokenId);
                        
                        nfts.push({
                          tokenId: tokenId.toString(),
                          collectionAddress,
                          collectionName,
                          tokenUri
                        });
                      }
                    } catch {
                      continue;
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error checking collection:', collectionAddress, err);
          }
        }
      }

      setOwnedNFTs(nfts);
    } catch (error) {
      console.error('Error loading owned NFTs:', error);
      setOwnedNFTs([]);
    }
  }

  async function loadCreatedCollections() {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet detected');
      }
      const provider = new BrowserProvider(window.ethereum);
      
      const factoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const currentBlock = await provider.getBlockNumber();
      const filter = factoryContract.filters.CollectionCreated(null, null, null, userAddress);
      const fromBlock = Math.max(0, currentBlock - 10000);
      const events = await factoryContract.queryFilter(filter, fromBlock) as EventLog[];

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

  function handleSaveProfile() {
    if (editForm && userProfile) {
      const updatedProfile = { ...userProfile, ...editForm };
      UserProfileManager.saveProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setIsEditing(false);
      
      // Add activity
      UserProfileManager.addActivity(userAddress, {
        type: 'transfer',
        description: 'Updated profile information',
      });
    }
  }

  function handleExportData() {
    const data = UserProfileManager.exportProfile(userAddress);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jugiter-profile-${userAddress.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleDateString();
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'mint': return '🎨';
      case 'create': return '✨';
      case 'transfer': return '🔄';
      case 'sale': return '💰';
      case 'list': return '📋';
      default: return '📝';
    }
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-800 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {userProfile.username?.charAt(0) || userAddress.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {userProfile.username || `User${userAddress.slice(-4)}`}
              </h2>
              <p className="text-sm text-zinc-400">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </p>
              {userProfile.bio && (
                <p className="text-sm text-zinc-300 mt-1">{userProfile.bio}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
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
        </div>

        {/* Profile Edit Form */}
        {isEditing && (
          <div className="border-b border-zinc-800 p-6 bg-zinc-800/50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                <input
                  type="url"
                  value={editForm.social?.website || ''}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    social: { ...editForm.social, website: e.target.value }
                  })}
                  className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
              <textarea
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Twitter</label>
                <input
                  type="text"
                  value={editForm.social?.twitter || ''}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    social: { ...editForm.social, twitter: e.target.value }
                  })}
                  className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Discord</label>
                <input
                  type="text"
                  value={editForm.social?.discord || ''}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    social: { ...editForm.social, discord: e.target.value }
                  })}
                  className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2"
                  placeholder="username#1234"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-zinc-800">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', count: null },
              { id: 'owned', label: 'Owned NFTs', count: ownedNFTs.length },
              { id: 'created', label: 'Created', count: createdCollections.length },
              { id: 'activity', label: 'Activity', count: userActivity.length },
              { id: 'settings', label: 'Settings', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label} {tab.count !== null && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{userProfile.stats?.nftsOwned || 0}</div>
                      <div className="text-sm text-zinc-400">NFTs Owned</div>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{userProfile.stats?.collectionsCreated || 0}</div>
                      <div className="text-sm text-zinc-400">Collections</div>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{userActivity.length}</div>
                      <div className="text-sm text-zinc-400">Activities</div>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {userProfile.stats?.joinedDate ? formatTimestamp(userProfile.stats.joinedDate) : 'N/A'}
                      </div>
                      <div className="text-sm text-zinc-400">Joined</div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {userProfile.social && Object.values(userProfile.social).some(val => val) && (
                    <div className="bg-zinc-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Social Links</h3>
                      <div className="flex gap-4">
                        {userProfile.social.website && (
                          <a href={userProfile.social.website} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:text-blue-300 transition-colors">
                            🌐 Website
                          </a>
                        )}
                        {userProfile.social.twitter && (
                          <a href={`https://twitter.com/${userProfile.social.twitter.replace('@', '')}`} 
                             target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:text-blue-300 transition-colors">
                            🐦 Twitter
                          </a>
                        )}
                        {userProfile.social.discord && (
                          <span className="text-purple-400">💬 {userProfile.social.discord}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
                    {userActivity.slice(0, 5).length > 0 ? (
                      <div className="space-y-3">
                        {userActivity.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getActivityIcon(activity.type)}</span>
                              <span className="text-zinc-300">{activity.description}</span>
                            </div>
                            <span className="text-zinc-500">{formatTimestamp(activity.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500">No recent activity</p>
                    )}
                  </div>
                </div>
              )}

              {/* Owned NFTs Tab */}
              {activeTab === 'owned' && (
                <div>
                  {ownedNFTs.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {ownedNFTs.map((nft, index) => (
                        <div key={index} className="bg-zinc-800 rounded-lg overflow-hidden hover:scale-105 transition-transform">
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
                      <div className="text-6xl mb-4">🖼️</div>
                      <h3 className="text-xl text-zinc-300 mb-2">No NFTs owned yet</h3>
                      <p className="text-zinc-500">Start collecting NFTs on Jugiter!</p>
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
                        <div key={index} className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-750 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xl font-semibold text-white mb-1">{collection.name}</h4>
                              <p className="text-sm text-zinc-400 mb-2">{collection.symbol}</p>
                              <p className="text-xs text-zinc-500 font-mono">{collection.address}</p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`https://sepolia.etherscan.io/address/${collection.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                              >
                                Etherscan
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎨</div>
                      <h3 className="text-xl text-zinc-300 mb-2">No collections created yet</h3>
                      <p className="text-zinc-500">Create your first NFT collection!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  {userActivity.length > 0 ? (
                    <div className="space-y-3">
                      {userActivity.map((activity) => (
                        <div key={activity.id} className="bg-zinc-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                              <div>
                                <p className="text-white font-medium">{activity.description}</p>
                                <p className="text-sm text-zinc-400">{formatTimestamp(activity.timestamp)}</p>
                              </div>
                            </div>
                            {activity.txHash && (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${activity.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                View TX →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl text-zinc-300 mb-2">No activity yet</h3>
                      <p className="text-zinc-500">Your activities will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <span className="text-zinc-300">Enable notifications</span>
                        <input
                          type="checkbox"
                          checked={userProfile.preferences?.notifications || false}
                          onChange={(e) => {
                            const updatedProfile = {
                              ...userProfile,
                              preferences: {
                                ...userProfile.preferences,
                                notifications: e.target.checked
                              }
                            };
                            UserProfileManager.saveProfile(updatedProfile);
                            setUserProfile(updatedProfile);
                          }}
                          className="w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-zinc-300">Newsletter subscription</span>
                        <input
                          type="checkbox"
                          checked={userProfile.preferences?.newsletter || false}
                          onChange={(e) => {
                            const updatedProfile = {
                              ...userProfile,
                              preferences: {
                                ...userProfile.preferences,
                                newsletter: e.target.checked
                              }
                            };
                            UserProfileManager.saveProfile(updatedProfile);
                            setUserProfile(updatedProfile);
                          }}
                          className="w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
                    <div className="space-y-3">
                      <button
                        onClick={handleExportData}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Export Profile Data
                      </button>
                      <div className="text-xs text-zinc-500">
                        Export your profile data as JSON for backup or migration.
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Profile Information</h3>
                    <div className="text-sm text-zinc-400 space-y-1">
                      <p><strong>Address:</strong> {userAddress}</p>
                      <p><strong>Profile created:</strong> {formatTimestamp(userProfile.stats?.joinedDate || '')}</p>
                      <p><strong>Last updated:</strong> {formatTimestamp(userProfile.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}