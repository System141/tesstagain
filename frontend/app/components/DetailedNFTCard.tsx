'use client';

import { useState } from 'react';
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

interface DetailedNFTCardProps {
  nft: DetailedNFTData;
  userAddress?: string | null;
  onBuy?: (nft: DetailedNFTData) => void;
  onList?: (nft: DetailedNFTData) => void;
  onView?: (nft: DetailedNFTData) => void;
  showDetails?: boolean;
}

export default function DetailedNFTCard({ 
  nft, 
  userAddress, 
  onBuy, 
  onList, 
  onView,
  showDetails = true 
}: DetailedNFTCardProps) {
  // const [imageLoaded, setImageLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [viewCount, setViewCount] = useState(nft.views || 0);

  const isOwner = userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase();
  const hasRarity = nft.rarityRank && nft.totalSupply;
  const rarityPercentage = hasRarity ? ((nft.totalSupply! - nft.rarityRank!) / nft.totalSupply!) * 100 : null;

  const handleCardClick = () => {
    if (onView) {
      onView(nft);
      setViewCount(prev => prev + 1);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  const getAttributeRarity = (attr: NFTAttribute) => {
    if (attr.rarity) {
      return `${attr.rarity}% have this trait`;
    }
    return null;
  };

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

  return (
    <div 
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* NFT Image Container */}
      <div className="relative aspect-square bg-zinc-800 overflow-hidden">
        <NFTImage
          tokenUri={nft.metadata?.image || ''}
          alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          width={400}
          height={400}
          // onLoad={() => setImageLoaded(true)}
        />

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Right Controls */}
        <div className="absolute top-3 right-3 flex gap-2">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors"
          >
            <svg className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Status Badge */}
          {nft.forSale ? (
            <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
              For Sale
            </span>
          ) : isOwner ? (
            <span className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
              Owned
            </span>
          ) : (
            <span className="bg-zinc-700/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
              Not Listed
            </span>
          )}
        </div>

        {/* Rarity Badge */}
        {hasRarity && (
          <div className="absolute top-3 left-3">
            <span className="bg-purple-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
              #{nft.rarityRank} ({rarityPercentage?.toFixed(1)}%)
            </span>
          </div>
        )}

        {/* Bottom Overlay Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex justify-between items-end text-white text-sm">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {(nft.likes || 0) + (liked ? 1 : 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Details */}
      <div className="p-5">
        {/* Collection & Token ID */}
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-blue-400 font-medium truncate">
              {nft.collectionName}
            </p>
            <h3 className="text-lg font-bold text-white mt-1 truncate">
              {nft.metadata?.name || `#${nft.tokenId}`}
            </h3>
          </div>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded ml-3 flex-shrink-0">
            #{nft.tokenId}
          </span>
        </div>

        {/* Description */}
        {nft.metadata?.description && showDetails && (
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
            {nft.metadata.description}
          </p>
        )}

        {/* Owner Info */}
        <div className="mb-4">
          <p className="text-xs text-zinc-500 mb-1">Owner</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {nft.owner.slice(2, 4).toUpperCase()}
            </div>
            <span className="text-sm text-zinc-300 font-medium">
              {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
            </span>
            {isOwner && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">You</span>
            )}
          </div>
        </div>

        {/* Attributes Preview */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && showDetails && (
          <div className="mb-4">
            <p className="text-xs text-zinc-500 mb-2">Attributes</p>
            <div className="flex flex-wrap gap-1.5">
              {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                <div key={index} className="group relative">
                  <span className="inline-block bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded border border-zinc-700 hover:border-zinc-600 transition-colors">
                    <span className="text-zinc-500">{attr.trait_type}:</span> {attr.value}
                  </span>
                  {getAttributeRarity(attr) && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {getAttributeRarity(attr)}
                    </div>
                  )}
                </div>
              ))}
              {nft.metadata.attributes.length > 3 && (
                <span className="inline-block bg-zinc-700 text-zinc-400 text-xs px-2 py-1 rounded">
                  +{nft.metadata.attributes.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price & Action Section */}
        <div className="space-y-3">
          {/* Current Price */}
          {nft.forSale && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-500">Current Price</p>
                <p className="text-xl font-bold text-white">
                  {formatEther(nft.price)} ETH
                </p>
                {nft.lastSalePrice && nft.lastSalePrice !== nft.price && (
                  <p className="text-xs text-zinc-500">
                    Last: {formatEther(nft.lastSalePrice)} ETH
                  </p>
                )}
              </div>
              {nft.listingDate && (
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Listed</p>
                  <p className="text-xs text-zinc-400">
                    {formatTimeAgo(nft.listingDate)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {nft.forSale ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuy?.(nft);
                }}
                disabled={Boolean(isOwner)}
                className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isOwner ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    You Own This
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5" />
                    </svg>
                    Buy Now
                  </>
                )}
              </button>
            ) : isOwner ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onList?.(nft);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                List for Sale
              </button>
            ) : (
              <div className="text-center py-3 text-zinc-500 text-sm border border-zinc-800 rounded-lg">
                Not for sale
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-zinc-500">Views</p>
                <p className="text-sm font-semibold text-white">{viewCount}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Likes</p>
                <p className="text-sm font-semibold text-white">{(nft.likes || 0) + (liked ? 1 : 0)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Rarity</p>
                <p className="text-sm font-semibold text-white">
                  {hasRarity ? `#${nft.rarityRank}` : '--'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}