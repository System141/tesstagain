'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import DetailedNFTCard from './DetailedNFTCard';
import NFTDetailModal from './NFTDetailModal';

interface NFTAttribute {
  trait_type: string;
  value: string;
  rarity?: number;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: NFTAttribute[];
  external_url?: string;
}

interface DetailedNFTData {
  tokenId: number;
  owner: string;
  price: bigint;
  forSale: boolean;
  lastSalePrice?: bigint;
  listingDate?: Date;
  views?: number;
  likes?: number;
  metadata?: NFTMetadata;
  collectionName: string;
  collectionAddress: string;
  rarityRank?: number;
  totalSupply?: number;
}

interface CollectionStats {
  totalItems: number;
  totalOwners: number;
  floorPrice: bigint;
  totalVolume: bigint;
  listedCount: number;
}

interface EnhancedMarketplaceProps {
  collectionAddress: string;
  collectionName: string;
}

const MARKETPLACE_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function EnhancedMarketplace({ collectionAddress, collectionName }: EnhancedMarketplaceProps) {
  const [nfts, setNfts] = useState<DetailedNFTData[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<DetailedNFTData[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<DetailedNFTData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all', // all, listed, not-listed, owned
    priceMin: '',
    priceMax: '',
    searchQuery: '',
    sortBy: 'recent', // recent, price-low, price-high, rarity
    attributes: {} as Record<string, string[]>
  });

  // Available attributes for filtering
  const [availableAttributes, setAvailableAttributes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadNFTs();
    checkUserConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionAddress]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nfts, filters]);

  const checkUserConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
      } catch {
        console.log('User not connected');
      }
    }
  };

  const loadNFTs = async () => {
    if (!window.ethereum) return;

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(collectionAddress, MARKETPLACE_ABI, provider);

      const totalSupply = await contract.totalSupply();
      const nftPromises = [];

      for (let i = 1; i <= Number(totalSupply); i++) {
        nftPromises.push(loadNFTData(contract, i, Number(totalSupply)));
      }

      const nftData = await Promise.all(nftPromises);
      const validNFTs = nftData.filter(nft => nft !== null) as DetailedNFTData[];
      
      setNfts(validNFTs);
      calculateStats(validNFTs);
      extractAttributes(validNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNFTData = async (contract: Contract, tokenId: number, totalSupply: number): Promise<DetailedNFTData | null> => {
    try {
      const [owner, tokenURI] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.tokenURI(tokenId)
      ]);

      // Mock additional data - in real app this would come from marketplace contract
      const mockPrice = BigInt(Math.floor(Math.random() * 1000000000000000000)); // Random price up to 1 ETH
      const mockForSale = Math.random() > 0.7; // 30% chance of being for sale
      const mockViews = Math.floor(Math.random() * 100);
      const mockLikes = Math.floor(Math.random() * 20);
      const mockRarityRank = Math.floor(Math.random() * totalSupply) + 1;

      // Load metadata
      let metadata = undefined;
      try {
        const metadataResponse = await fetch(`/api/ipfs?url=${tokenURI}`);
        if (metadataResponse.ok) {
          metadata = await metadataResponse.json();
        }
      } catch {
        console.log(`Failed to load metadata for token ${tokenId}`);
      }

      return {
        tokenId,
        owner,
        price: mockForSale ? mockPrice : BigInt(0),
        forSale: mockForSale,
        lastSalePrice: mockForSale ? BigInt(Math.floor(Math.random() * 800000000000000000)) : undefined,
        listingDate: mockForSale ? new Date(Date.now() - Math.random() * 86400000 * 7) : undefined,
        views: mockViews,
        likes: mockLikes,
        metadata,
        collectionName,
        collectionAddress,
        rarityRank: mockRarityRank,
        totalSupply
      };
    } catch (error) {
      console.error(`Error loading NFT ${tokenId}:`, error);
      return null;
    }
  };

  const calculateStats = (nfts: DetailedNFTData[]) => {
    const listedNfts = nfts.filter(nft => nft.forSale);
    const uniqueOwners = new Set(nfts.map(nft => nft.owner)).size;
    const floorPrice = listedNfts.length > 0 
      ? listedNfts.reduce((min, nft) => nft.price < min ? nft.price : min, listedNfts[0].price)
      : BigInt(0);
    
    // Mock total volume calculation
    const totalVolume = BigInt(Math.floor(Math.random() * 50000000000000000000)); // Random volume up to 50 ETH

    setStats({
      totalItems: nfts.length,
      totalOwners: uniqueOwners,
      floorPrice,
      totalVolume,
      listedCount: listedNfts.length
    });
  };

  const extractAttributes = (nfts: DetailedNFTData[]) => {
    const attributes: Record<string, Set<string>> = {};
    
    nfts.forEach(nft => {
      if (nft.metadata?.attributes) {
        nft.metadata.attributes.forEach(attr => {
          if (!attributes[attr.trait_type]) {
            attributes[attr.trait_type] = new Set();
          }
          attributes[attr.trait_type].add(attr.value);
        });
      }
    });

    const attributeArrays: Record<string, string[]> = {};
    Object.entries(attributes).forEach(([key, valueSet]) => {
      attributeArrays[key] = Array.from(valueSet).sort();
    });

    setAvailableAttributes(attributeArrays);
  };

  const applyFilters = () => {
    let filtered = [...nfts];

    // Status filter
    if (filters.status === 'listed') {
      filtered = filtered.filter(nft => nft.forSale);
    } else if (filters.status === 'not-listed') {
      filtered = filtered.filter(nft => !nft.forSale);
    } else if (filters.status === 'owned' && userAddress) {
      filtered = filtered.filter(nft => nft.owner.toLowerCase() === userAddress.toLowerCase());
    }

    // Price filter
    if (filters.priceMin) {
      const minPrice = BigInt(Math.floor(parseFloat(filters.priceMin) * 1000000000000000000));
      filtered = filtered.filter(nft => nft.forSale && nft.price >= minPrice);
    }
    if (filters.priceMax) {
      const maxPrice = BigInt(Math.floor(parseFloat(filters.priceMax) * 1000000000000000000));
      filtered = filtered.filter(nft => nft.forSale && nft.price <= maxPrice);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(nft => 
        nft.metadata?.name?.toLowerCase().includes(query) ||
        nft.tokenId.toString().includes(query) ||
        nft.metadata?.description?.toLowerCase().includes(query)
      );
    }

    // Attribute filters
    Object.entries(filters.attributes).forEach(([traitType, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(nft => 
          nft.metadata?.attributes?.some(attr => 
            attr.trait_type === traitType && values.includes(attr.value)
          )
        );
      }
    });

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          if (!a.forSale && !b.forSale) return 0;
          if (!a.forSale) return 1;
          if (!b.forSale) return -1;
          return a.price < b.price ? -1 : 1;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          if (!a.forSale && !b.forSale) return 0;
          if (!a.forSale) return 1;
          if (!b.forSale) return -1;
          return a.price > b.price ? -1 : 1;
        });
        break;
      case 'rarity':
        filtered.sort((a, b) => (a.rarityRank || 999999) - (b.rarityRank || 999999));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => b.tokenId - a.tokenId);
        break;
    }

    setFilteredNfts(filtered);
  };

  const handleAttributeFilter = (traitType: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev.attributes[traitType] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        attributes: {
          ...prev.attributes,
          [traitType]: newValues
        }
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priceMin: '',
      priceMax: '',
      searchQuery: '',
      sortBy: 'recent',
      attributes: {}
    });
  };

  const handleNFTView = (nft: DetailedNFTData) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-zinc-400 text-lg">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Collection Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.totalItems}</div>
              <div className="text-sm text-zinc-400">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.totalOwners}</div>
              <div className="text-sm text-zinc-400">Owners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.floorPrice > 0 ? `${parseFloat(formatEther(stats.floorPrice)).toFixed(3)}` : '--'}
              </div>
              <div className="text-sm text-zinc-400">Floor Price (ETH)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {parseFloat(formatEther(stats.totalVolume)).toFixed(1)}
              </div>
              <div className="text-sm text-zinc-400">Total Volume (ETH)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.listedCount}</div>
              <div className="text-sm text-zinc-400">Listed</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Items</option>
                  <option value="listed">Listed</option>
                  <option value="not-listed">Not Listed</option>
                  <option value="owned">My Items</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Price Range (ETH)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                    className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                    className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Attribute Filters */}
              {Object.entries(availableAttributes).map(([traitType, values]) => (
                <div key={traitType}>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">{traitType}</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {values.map(value => (
                      <label key={value} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={(filters.attributes[traitType] || []).includes(value)}
                          onChange={() => handleAttributeFilter(traitType, value)}
                          className="mr-2 rounded"
                        />
                        <span className="text-zinc-300 truncate">{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, ID, or description..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 pr-10"
              />
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 min-w-[150px]"
            >
              <option value="recent">Recently Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rarity">Rarity Rank</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-zinc-400">
              {filteredNfts.length} of {nfts.length} items
            </p>
          </div>

          {/* NFT Grid */}
          {filteredNfts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredNfts.map((nft) => (
                <DetailedNFTCard
                  key={nft.tokenId}
                  nft={nft}
                  userAddress={userAddress}
                  onView={handleNFTView}
                  showDetails={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl text-zinc-300 mb-2">No NFTs Found</h3>
              <p className="text-zinc-500 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NFT Detail Modal */}
      <NFTDetailModal
        nft={selectedNFT}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNFT(null);
        }}
        userAddress={userAddress}
      />
    </div>
  );
}