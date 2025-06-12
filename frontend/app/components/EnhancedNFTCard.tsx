import { useState, useEffect } from 'react';
import { formatEther } from 'ethers';
import NFTImage from './NFTImage';

interface NFTData {
  tokenId: number;
  owner: string;
  price: bigint;
  forSale: boolean;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
  rarity?: {
    rank: number;
    score: number;
    total: number;
  };
  lastSale?: {
    price: bigint;
    timestamp: number;
  };
}

interface EnhancedNFTCardProps {
  nft: NFTData;
  userAddress?: string | null;
  onView?: (nft: NFTData) => void;
  onBuy?: (nft: NFTData) => void;
  onMakeOffer?: (nft: NFTData) => void;
  compact?: boolean;
}

export default function EnhancedNFTCard({ 
  nft, 
  userAddress, 
  onView, 
  onBuy, 
  onMakeOffer,
  compact = false 
}: EnhancedNFTCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  useEffect(() => {
    // Generate mock price history for demonstration
    const history = Array.from({ length: 7 }, () => Math.random() * 0.5 + 0.5);
    setPriceHistory(history);
  }, []);

  const isOwner = userAddress && nft.owner.toLowerCase() === userAddress.toLowerCase();
  const hasRarity = nft.rarity && nft.rarity.rank > 0;

  const formatRarity = (rank: number, total: number) => {
    const percentage = ((total - rank + 1) / total) * 100;
    if (percentage > 95) return { text: "Legendary", color: "text-yellow-400" };
    if (percentage > 85) return { text: "Epic", color: "text-purple-400" };
    if (percentage > 70) return { text: "Rare", color: "text-blue-400" };
    if (percentage > 50) return { text: "Uncommon", color: "text-green-400" };
    return { text: "Common", color: "text-zinc-400" };
  };

  const rarityInfo = hasRarity ? formatRarity(nft.rarity!.rank, nft.rarity!.total) : null;

  const generateMiniChart = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return data.map((value, index) => {
      const height = ((value - min) / range) * 20 + 2;
      return (
        <div
          key={index}
          className="bg-green-400 rounded-sm"
          style={{
            height: `${height}px`,
            width: '3px',
            marginRight: '1px'
          }}
        />
      );
    });
  };

  if (compact) {
    return (
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-all cursor-pointer group"
        onClick={() => onView?.(nft)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="aspect-square bg-zinc-800 relative overflow-hidden">
          <NFTImage
            tokenUri={nft.metadata?.image}
            alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            width={200}
            height={200}
          />
          
          {/* Overlay Actions */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex gap-2">
                {nft.forSale && !isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuy?.(nft);
                    }}
                    className="px-3 py-1 bg-white text-black rounded text-sm font-medium hover:bg-zinc-100"
                  >
                    Buy Now
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMakeOffer?.(nft);
                  }}
                  className="px-3 py-1 bg-zinc-800 text-white rounded text-sm border border-zinc-600 hover:bg-zinc-700"
                >
                  Offer
                </button>
              </div>
            </div>
          )}

          {/* Rarity Badge */}
          {rarityInfo && (
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 text-xs rounded ${rarityInfo.color} bg-black/60 backdrop-blur-sm`}>
                {rarityInfo.text}
              </span>
            </div>
          )}

          {/* Price */}
          {nft.forSale && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-black/80 backdrop-blur-sm rounded px-2 py-1">
                <p className="text-white font-medium text-sm">
                  {formatEther(nft.price)} ETH
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-white font-medium truncate text-sm">
            {nft.metadata?.name || `#${nft.tokenId}`}
          </p>
          {hasRarity && (
            <p className="text-zinc-400 text-xs">
              Rank #{nft.rarity!.rank}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        <NFTImage
          tokenUri={nft.metadata?.image}
          alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          width={300}
          height={300}
        />
        
        {/* Status Indicators */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {nft.forSale && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
              Listed
            </span>
          )}
          {isOwner && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              Owned
            </span>
          )}
        </div>

        {/* Rarity Badge */}
        {rarityInfo && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs rounded-full ${rarityInfo.color} bg-black/80 backdrop-blur-sm`}>
              {rarityInfo.text} #{nft.rarity!.rank}
            </span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-3">
              <button
                onClick={() => onView?.(nft)}
                className="px-4 py-2 bg-zinc-800/90 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                View Details
              </button>
              {nft.forSale && !isOwner && (
                <button
                  onClick={() => onBuy?.(nft)}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors font-medium"
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NFT Details */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 truncate">
              {nft.metadata?.name || `NFT #${nft.tokenId}`}
            </h3>
            <p className="text-zinc-400 text-sm">
              #{nft.tokenId} • Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
            </p>
          </div>
          
          {/* Price Trend Mini Chart */}
          {priceHistory.length > 0 && (
            <div className="flex items-end gap-px h-6">
              {generateMiniChart(priceHistory)}
            </div>
          )}
        </div>

        {/* Attributes */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-lg"
                >
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
              {nft.metadata.attributes.length > 3 && (
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-lg">
                  +{nft.metadata.attributes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price and Actions */}
        <div className="space-y-3">
          {nft.forSale ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-zinc-400 text-sm">Current Price</p>
                <p className="text-2xl font-bold text-white">
                  {formatEther(nft.price)} ETH
                </p>
                {nft.lastSale && (
                  <p className="text-zinc-500 text-xs">
                    Last sale: {formatEther(nft.lastSale.price)} ETH
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-zinc-400 text-sm">Not Listed</p>
              {nft.lastSale && (
                <p className="text-zinc-300">
                  Last sale: {formatEther(nft.lastSale.price)} ETH
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {nft.forSale && !isOwner ? (
              <>
                <button
                  onClick={() => onBuy?.(nft)}
                  className="flex-1 bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => onMakeOffer?.(nft)}
                  className="flex-1 bg-zinc-800 text-white py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  Make Offer
                </button>
              </>
            ) : isOwner ? (
              <button
                onClick={() => onView?.(nft)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Manage NFT
              </button>
            ) : (
              <button
                onClick={() => onMakeOffer?.(nft)}
                className="w-full bg-zinc-800 text-white py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                Make Offer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}