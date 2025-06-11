'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'ethers';
import NFTImage from './NFTImage';

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
  animation_url?: string;
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

interface NFTDetailModalProps {
  nft: DetailedNFTData | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: (nft: DetailedNFTData) => void;
  onList?: (nft: DetailedNFTData) => void;
  userAddress?: string | null;
}

interface ActivityItem {
  type: 'mint' | 'sale' | 'transfer' | 'list';
  price?: bigint;
  from: string;
  to: string;
  timestamp: Date;
  txHash: string;
}

export default function NFTDetailModal({ 
  nft, 
  isOpen, 
  onClose, 
  onBuy, 
  onList, 
  userAddress 
}: NFTDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'attributes' | 'activity' | 'offers'>('details');
  const [liked, setLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Mock activity data - in real app this would come from blockchain events
  const [activity] = useState<ActivityItem[]>([
    {
      type: 'mint',
      from: '0x0000000000000000000000000000000000000000',
      to: nft?.owner || '',
      timestamp: new Date(Date.now() - 86400000 * 7), // 7 days ago
      txHash: '0x1234567890abcdef1234567890abcdef12345678'
    },
    {
      type: 'list',
      price: nft?.price || BigInt(0),
      from: nft?.owner || '',
      to: '0x0000000000000000000000000000000000000000',
      timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
      txHash: '0xabcdef1234567890abcdef1234567890abcdef12'
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !nft) return null;

  const isOwner = userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase();
  const hasRarity = nft.rarityRank && nft.totalSupply;
  const rarityPercentage = hasRarity ? ((nft.totalSupply! - nft.rarityRank!) / nft.totalSupply!) * 100 : null;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return (
          <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'sale':
        return (
          <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5" />
            </svg>
          </div>
        );
      case 'transfer':
        return (
          <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'list':
        return (
          <div className="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {nft.metadata?.name || `#${nft.tokenId}`}
            </h2>
            <p className="text-blue-400 font-medium">{nft.collectionName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(90vh-80px)]">
          {/* Left Column - Image */}
          <div className="relative bg-zinc-800 flex items-center justify-center p-8">
            <div className="relative max-w-full max-h-full">
              <NFTImage
                tokenUri={nft.metadata?.image || ''}
                alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                width={500}
                height={500}
              />
              
              {/* Image Overlay Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setLiked(!liked)}
                  className="bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                >
                  <svg className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                {hasRarity && (
                  <div className="bg-purple-500/90 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium">
                    Rarity #{nft.rarityRank} ({rarityPercentage?.toFixed(1)}%)
                  </div>
                )}
              </div>

              {/* External Link */}
              {nft.metadata?.external_url && (
                <div className="absolute bottom-4 left-4">
                  <a
                    href={nft.metadata.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="flex flex-col">
            {/* Price & Action Section */}
            <div className="p-6 border-b border-zinc-800">
              {nft.forSale ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Current Price</p>
                    <p className="text-3xl font-bold text-white">
                      {formatEther(nft.price)} ETH
                    </p>
                    {nft.lastSalePrice && nft.lastSalePrice !== nft.price && (
                      <p className="text-sm text-zinc-500">
                        Last sold for {formatEther(nft.lastSalePrice)} ETH
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => onBuy?.(nft)}
                      disabled={Boolean(isOwner)}
                      className="flex-1 bg-white text-black py-3 px-6 rounded-lg font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isOwner ? 'You Own This' : 'Buy Now'}
                    </button>
                    <button className="px-6 py-3 border border-zinc-700 text-white rounded-lg hover:border-zinc-600 transition-colors">
                      Make Offer
                    </button>
                  </div>
                </div>
              ) : isOwner ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">You own this NFT</p>
                    <p className="text-lg text-white">Not listed for sale</p>
                  </div>
                  <button
                    onClick={() => onList?.(nft)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    List for Sale
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Status</p>
                  <p className="text-lg text-white">Not for sale</p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {['details', 'attributes', 'activity', 'offers'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'details' | 'attributes' | 'activity' | 'offers')}
                  className={`flex-1 py-3 px-4 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Owner */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300 mb-2">Owner</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {nft.owner.slice(2, 4).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                        </p>
                        {isOwner && <p className="text-xs text-green-400">You</p>}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {nft.metadata?.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-300 mb-2">Description</h4>
                      <div className="text-zinc-400 leading-relaxed">
                        <p className={showFullDescription ? '' : 'line-clamp-3'}>
                          {nft.metadata.description}
                        </p>
                        {nft.metadata.description.length > 200 && (
                          <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-blue-400 hover:text-blue-300 text-sm mt-1"
                          >
                            {showFullDescription ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Token Details */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3">Token Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Token ID</span>
                        <span className="text-white">#{nft.tokenId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Collection</span>
                        <span className="text-white">{nft.collectionName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Contract</span>
                        <span className="text-white font-mono text-xs">
                          {nft.collectionAddress.slice(0, 6)}...{nft.collectionAddress.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Blockchain</span>
                        <span className="text-white">Ethereum Sepolia</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attributes' && (
                <div className="space-y-4">
                  {nft.metadata?.attributes && nft.metadata.attributes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nft.metadata.attributes.map((attr, index) => (
                        <div key={index} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                            {attr.trait_type}
                          </div>
                          <div className="text-white font-semibold mb-1">{attr.value}</div>
                          {attr.rarity && (
                            <div className="text-xs text-zinc-400">
                              {attr.rarity}% have this trait
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p>No attributes defined</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {activity.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg">
                      {getActivityIcon(item.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-medium capitalize">{item.type}</p>
                          <p className="text-xs text-zinc-500">{formatTimeAgo(item.timestamp)}</p>
                        </div>
                        {item.price && (
                          <p className="text-sm text-zinc-400 mb-1">
                            {formatEther(item.price)} ETH
                          </p>
                        )}
                        <div className="text-xs text-zinc-500">
                          From {item.from.slice(0, 6)}...{item.from.slice(-4)} to{' '}
                          {item.to.slice(0, 6)}...{item.to.slice(-4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'offers' && (
                <div className="text-center py-8 text-zinc-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No offers yet</p>
                  <p className="text-xs mt-1">Be the first to make an offer!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}