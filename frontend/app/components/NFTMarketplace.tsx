'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther, EventLog } from 'ethers';
import NFTImage from './NFTImage';
import { RobustProvider } from './RpcProvider';

interface NFTListing {
  listingId?: string;
  tokenId: number;
  owner: string;
  seller?: string;
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

interface Offer {
  buyer: string;
  amount: bigint;
  timestamp: number;
}

interface NFTMarketplaceProps {
  collectionAddress: string;
  collectionName: string;
  marketplaceAddress?: string;
}

// NFT Collection ABI
const NFT_COLLECTION_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)"
];

// Marketplace Contract ABI
const MARKETPLACE_ABI = [
  "function createListing(address nftContract, uint256 tokenId, uint256 price) returns (uint256)",
  "function updateListing(uint256 listingId, uint256 newPrice)",
  "function cancelListing(uint256 listingId)",
  "function buyNFT(uint256 listingId) payable",
  "function makeOffer(address nftContract, uint256 tokenId) payable",
  "function cancelOffer(address nftContract, uint256 tokenId)",
  "function acceptOffer(address nftContract, uint256 tokenId, address buyer)",
  "function getActiveOffers(address nftContract, uint256 tokenId) view returns (address[] buyers, uint256[] amounts, uint256[] timestamps)",
  "function listings(uint256) view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool active)",
  "function nextListingId() view returns (uint256)",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)",
  "event ListingCancelled(uint256 indexed listingId)",
  "event Sale(uint256 indexed listingId, address indexed buyer, address indexed seller, address nftContract, uint256 tokenId, uint256 price)",
  "event OfferMade(address indexed nftContract, uint256 indexed tokenId, address indexed buyer, uint256 amount)"
];

export default function NFTMarketplace({ collectionAddress, collectionName, marketplaceAddress }: NFTMarketplaceProps) {
  const [nfts, setNfts] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [showOnlyForSale, setShowOnlyForSale] = useState(false);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [isTransacting, setIsTransacting] = useState(false);
  const [activeListings, setActiveListings] = useState<Map<string, {
    listingId: string;
    seller: string;
    price: bigint;
    active: boolean;
  }>>(new Map());
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);

  useEffect(() => {
    loadNFTs();
    checkUserConnection();
    if (marketplaceAddress) {
      loadMarketplaceListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionAddress, marketplaceAddress]);

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
    setLoading(true);
    try {
      const robustProvider = RobustProvider.getInstance();
      const provider = await robustProvider.getProvider();
      const contract = new Contract(collectionAddress, NFT_COLLECTION_ABI, provider);

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

  const loadMarketplaceListings = async () => {
    if (!marketplaceAddress) return;
    
    try {
      const robustProvider = RobustProvider.getInstance();
      const provider = await robustProvider.getProvider();
      const marketplaceContract = new Contract(marketplaceAddress, MARKETPLACE_ABI, provider);
      
      // Get listing events for this collection
      const filter = marketplaceContract.filters.ListingCreated(null, null, collectionAddress);
      const events = await robustProvider.queryFilter(marketplaceContract, filter, -10000) as EventLog[];
      
      const listingsMap = new Map();
      
      for (const event of events) {
        if ('args' in event && Array.isArray(event.args)) {
          const listingId = event.args[0].toString();
          const [seller, nftContract, tokenId, price, active] = await marketplaceContract.listings(listingId);
          
          if (active && nftContract.toLowerCase() === collectionAddress.toLowerCase()) {
            listingsMap.set(tokenId.toString(), {
              listingId,
              seller,
              price,
              active: true
            });
          }
        }
      }
      
      setActiveListings(listingsMap);
    } catch (error) {
      console.error('Error loading marketplace listings:', error);
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

      // Check if this NFT has an active listing
      const listing = activeListings.get(tokenId.toString());
      
      return {
        tokenId,
        owner,
        seller: listing?.seller,
        listingId: listing?.listingId,
        price: listing?.price || BigInt(0),
        forSale: listing?.active || false,
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

    if (!marketplaceAddress) {
      alert('Marketplace contract not configured');
      return;
    }

    if (nft.owner.toLowerCase() === userAddress.toLowerCase()) {
      alert('You already own this NFT');
      return;
    }

    setIsTransacting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = new Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      
      if (nft.listingId) {
        const tx = await marketplaceContract.buyNFT(nft.listingId, { value: nft.price });
        await tx.wait();
        alert('Purchase successful!');
        await loadNFTs();
        await loadMarketplaceListings();
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Failed to purchase NFT');
    } finally {
      setIsTransacting(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!window.ethereum || !userAddress || !selectedNFT || !marketplaceAddress) {
      alert('Please connect your wallet');
      return;
    }
    
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      alert('Please enter a valid offer amount');
      return;
    }
    
    setIsTransacting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = new Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      
      const value = parseEther(offerAmount);
      const tx = await marketplaceContract.makeOffer(collectionAddress, selectedNFT.tokenId, { value });
      await tx.wait();
      
      alert('Offer submitted successfully!');
      setShowOfferModal(false);
      setOfferAmount('');
      await loadOffers(selectedNFT.tokenId);
    } catch (error) {
      console.error('Error making offer:', error);
      alert('Failed to make offer');
    } finally {
      setIsTransacting(false);
    }
  };

  const loadOffers = async (tokenId: number) => {
    if (!marketplaceAddress) return;
    
    try {
      const robustProvider = RobustProvider.getInstance();
      const provider = await robustProvider.getProvider();
      const marketplaceContract = new Contract(marketplaceAddress, MARKETPLACE_ABI, provider);
      
      const [buyers, amounts, timestamps] = await marketplaceContract.getActiveOffers(collectionAddress, tokenId);
      
      const offers: Offer[] = buyers.map((buyer: string, i: number) => ({
        buyer,
        amount: amounts[i],
        timestamp: Number(timestamps[i])
      }));
      
      setActiveOffers(offers);
    } catch (error) {
      console.error('Error loading offers:', error);
      setActiveOffers([]);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!window.ethereum || !userAddress || !selectedNFT || !marketplaceAddress) return;
    
    setIsTransacting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // First approve marketplace if needed
      const nftContract = new Contract(collectionAddress, NFT_COLLECTION_ABI, signer);
      const isApproved = await nftContract.isApprovedForAll(userAddress, marketplaceAddress);
      
      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(marketplaceAddress, true);
        await approveTx.wait();
      }
      
      const marketplaceContract = new Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      const tx = await marketplaceContract.acceptOffer(collectionAddress, selectedNFT.tokenId, offer.buyer);
      await tx.wait();
      
      alert('Offer accepted successfully!');
      setShowOfferModal(false);
      await loadNFTs();
      await loadMarketplaceListings();
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer');
    } finally {
      setIsTransacting(false);
    }
  };

  const handleListForSale = async (nft: NFTListing) => {
    if (!window.ethereum || !userAddress || !marketplaceAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (nft.owner.toLowerCase() !== userAddress.toLowerCase()) {
      alert('You can only list your own NFTs');
      return;
    }

    if (!sellPrice || parseFloat(sellPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setIsTransacting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // First approve marketplace if needed
      const nftContract = new Contract(collectionAddress, NFT_COLLECTION_ABI, signer);
      const isApproved = await nftContract.isApprovedForAll(userAddress, marketplaceAddress);
      
      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(marketplaceAddress, true);
        await approveTx.wait();
      }
      
      // Create listing
      const marketplaceContract = new Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      const price = parseEther(sellPrice);
      const tx = await marketplaceContract.createListing(collectionAddress, nft.tokenId, price);
      await tx.wait();
      
      alert('NFT listed successfully!');
      await loadMarketplaceListings();
      await loadNFTs();
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
                  ) : (
                    <div>
                      {userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase() ? (
                        <button
                          onClick={() => setSelectedNFT(nft)}
                          disabled={!marketplaceAddress}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                        >
                          List for Sale
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedNFT(nft);
                            setShowOfferModal(true);
                            loadOffers(nft.tokenId);
                          }}
                          disabled={!marketplaceAddress}
                          className="w-full bg-zinc-700 text-white py-2 rounded-lg font-medium hover:bg-zinc-600 transition-colors text-sm disabled:opacity-50"
                        >
                          Make Offer
                        </button>
                      )}
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

      {/* Offer Modal */}
      {showOfferModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Make an Offer
            </h3>
            
            <div className="mb-4">
              <p className="text-zinc-300 text-sm mb-2">
                {selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}
              </p>
              {selectedNFT.forSale && (
                <p className="text-zinc-500 text-xs">
                  Listed price: {formatEther(selectedNFT.price)} ETH
                </p>
              )}
            </div>

            {activeOffers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Active Offers</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {activeOffers.map((offer, index) => (
                    <div key={index} className="flex justify-between items-center bg-zinc-800 rounded p-2">
                      <span className="text-xs text-zinc-400">
                        {offer.buyer.slice(0, 6)}...{offer.buyer.slice(-4)}
                      </span>
                      <span className="text-sm text-white">
                        {formatEther(offer.amount)} ETH
                      </span>
                      {userAddress?.toLowerCase() === selectedNFT.owner.toLowerCase() && (
                        <button
                          onClick={() => handleAcceptOffer(offer)}
                          disabled={isTransacting}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userAddress?.toLowerCase() !== selectedNFT.owner.toLowerCase() && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Offer Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:border-zinc-500 focus:outline-none"
                  placeholder="0.1"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setSelectedNFT(null);
                  setOfferAmount('');
                  setActiveOffers([]);
                }}
                className="flex-1 bg-zinc-700 text-white py-2 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Close
              </button>
              {userAddress?.toLowerCase() !== selectedNFT.owner.toLowerCase() && (
                <button
                  onClick={handleMakeOffer}
                  disabled={!offerAmount || isTransacting}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  {isTransacting ? 'Processing...' : 'Submit Offer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}