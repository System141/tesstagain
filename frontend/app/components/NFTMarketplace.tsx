'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import NFTImage from './NFTImage';

interface NFTListing {
  tokenId: number;
  owner: string;
  price: bigint;
  forSale: boolean;
  metadataUri: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
}

interface NFTMarketplaceProps {
  collectionAddress: string;
  collectionName: string;
}

// Extended ABI for marketplace functionality
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
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getApproved",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function NFTMarketplace({ collectionAddress, collectionName }: NFTMarketplaceProps) {
  const [nfts, setNfts] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [showOnlyForSale, setShowOnlyForSale] = useState(false);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [isTransacting, setIsTransacting] = useState(false);

  useEffect(() => {
    loadNFTs();
    checkUserConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionAddress]);

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
        nftPromises.push(loadNFTData(contract, i));
      }

      const nftData = await Promise.all(nftPromises);
      const validNFTs = nftData.filter(nft => nft !== null) as NFTListing[];
      
      setNfts(validNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNFTData = async (contract: Contract, tokenId: number): Promise<NFTListing | null> => {
    try {
      const [owner, tokenURI] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.tokenURI(tokenId)
      ]);

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
        price: BigInt(0), // In a real marketplace, this would come from a marketplace contract
        forSale: false, // In a real marketplace, this would be tracked
        metadataUri: tokenURI,
        metadata
      };
    } catch (error) {
      console.error(`Error loading NFT ${tokenId}:`, error);
      return null;
    }
  };

  const handleBuyNFT = async (nft: NFTListing) => {
    if (!window.ethereum || !userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (nft.owner.toLowerCase() === userAddress.toLowerCase()) {
      alert('You already own this NFT');
      return;
    }

    setIsTransacting(true);
    try {
      // In a real marketplace, this would interact with a marketplace contract
      // For now, this is just a placeholder
      alert('Marketplace functionality requires a marketplace contract. This is a demo of the UI.');
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Failed to purchase NFT');
    } finally {
      setIsTransacting(false);
    }
  };

  const handleListForSale = async (nft: NFTListing) => {
    if (!window.ethereum || !userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (nft.owner.toLowerCase() !== userAddress.toLowerCase()) {
      alert('You can only list your own NFTs');
      return;
    }

    setIsTransacting(true);
    try {
      // In a real marketplace, this would:
      // 1. Approve the marketplace contract to transfer the NFT
      // 2. List the NFT on the marketplace contract
      alert('Listing functionality requires a marketplace contract. This is a demo of the UI.');
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Failed to list NFT');
    } finally {
      setIsTransacting(false);
      setSelectedNFT(null);
      setSellPrice('');
    }
  };

  const filteredNFTs = nfts.filter(nft => {
    if (showOnlyForSale && !nft.forSale) return false;
    if (showOnlyOwned && userAddress && nft.owner.toLowerCase() !== userAddress.toLowerCase()) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading NFT marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          {collectionName} Marketplace
        </h3>
        
        {/* Filters */}
        <div className="flex gap-4">
          <label className="flex items-center text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={showOnlyForSale}
              onChange={(e) => setShowOnlyForSale(e.target.checked)}
              className="mr-2"
            />
            For Sale Only
          </label>
          <label className="flex items-center text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={showOnlyOwned}
              onChange={(e) => setShowOnlyOwned(e.target.checked)}
              className="mr-2"
            />
            My NFTs
          </label>
        </div>
      </div>

      {filteredNFTs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🖼️</div>
          <h4 className="text-lg text-zinc-300 mb-2">No NFTs Found</h4>
          <p className="text-zinc-500">
            {showOnlyForSale ? 'No NFTs are currently for sale.' : 
             showOnlyOwned ? 'You don\'t own any NFTs in this collection.' :
             'This collection doesn\'t have any minted NFTs yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <div key={nft.tokenId} className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors">
              {/* NFT Image */}
              <div className="aspect-square bg-zinc-700 relative">
                <NFTImage
                  tokenUri={nft.metadata?.image || nft.metadataUri}
                  alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                  className="w-full h-full object-cover"
                  width={250}
                  height={250}
                />
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {nft.forSale ? (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      For Sale
                    </span>
                  ) : userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase() ? (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                      Owned
                    </span>
                  ) : null}
                </div>
              </div>

              {/* NFT Details */}
              <div className="p-4">
                <h4 className="font-semibold text-white mb-1 truncate">
                  {nft.metadata?.name || `NFT #${nft.tokenId}`}
                </h4>
                
                <p className="text-xs text-zinc-400 mb-3 truncate">
                  Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                </p>

                {nft.metadata?.description && (
                  <p className="text-sm text-zinc-300 mb-3 line-clamp-2">
                    {nft.metadata.description}
                  </p>
                )}

                {/* Attributes */}
                {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {nft.metadata.attributes.slice(0, 2).map((attr, index) => (
                        <span key={index} className="px-2 py-1 bg-zinc-700 text-xs text-zinc-300 rounded">
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                      {nft.metadata.attributes.length > 2 && (
                        <span className="px-2 py-1 bg-zinc-700 text-xs text-zinc-300 rounded">
                          +{nft.metadata.attributes.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {nft.forSale ? (
                    <div>
                      <div className="text-lg font-bold text-white mb-2">
                        {formatEther(nft.price)} ETH
                      </div>
                      <button
                        onClick={() => handleBuyNFT(nft)}
                        disabled={isTransacting || Boolean(userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase())}
                        className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase() ? 'You Own This' : 'Buy Now'}
                      </button>
                    </div>
                  ) : userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase() ? (
                    <button
                      onClick={() => setSelectedNFT(nft)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                    >
                      List for Sale
                    </button>
                  ) : (
                    <div className="text-center py-2 text-zinc-500 text-sm">
                      Not for sale
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List for Sale Modal */}
      {selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              List NFT for Sale
            </h3>
            
            <div className="mb-4">
              <p className="text-zinc-300 text-sm mb-2">
                {selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}
              </p>
              <p className="text-zinc-500 text-xs">
                Token ID: {selectedNFT.tokenId}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:border-zinc-500 focus:outline-none"
                placeholder="0.1"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedNFT(null);
                  setSellPrice('');
                }}
                className="flex-1 bg-zinc-700 text-white py-2 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleListForSale(selectedNFT)}
                disabled={!sellPrice || isTransacting}
                className="flex-1 bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                List for Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}