import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import NFTImage from './NFTImage';

interface NFTGalleryProps {
  collectionAddress: string;
  userAddress?: string | null;
  showAll?: boolean; // Show all NFTs or just user's NFTs
  maxItems?: number;
}

const NFT_COLLECTION_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface NFTItem {
  tokenId: number;
  tokenUri: string;
  owner: string;
}

export default function NFTGallery({ 
  collectionAddress, 
  userAddress, 
  showAll = false, 
  maxItems = 12 
}: NFTGalleryProps) {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      if (!collectionAddress || !window.ethereum) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(collectionAddress, NFT_COLLECTION_ABI, provider);

        const totalSupply = await contract.totalSupply();
        const totalCount = Number(totalSupply);

        if (totalCount === 0) {
          setNfts([]);
          setIsLoading(false);
          return;
        }

        const nftPromises: Promise<NFTItem | null>[] = [];

        // Fetch NFTs (tokenIds start from 1)
        for (let tokenId = 1; tokenId <= Math.min(totalCount, maxItems); tokenId++) {
          nftPromises.push(
            (async () => {
              try {
                // First check if token exists by checking owner
                const owner = await contract.ownerOf(tokenId);
                
                // Only fetch tokenURI if token exists (has an owner)
                const tokenUri = await contract.tokenURI(tokenId);

                // If showing only user's NFTs, filter by owner
                if (!showAll && userAddress && owner.toLowerCase() !== userAddress.toLowerCase()) {
                  return null;
                }

                return {
                  tokenId,
                  tokenUri,
                  owner
                };
              } catch (err) {
                // Token might not exist or tokenURI might fail
                console.warn(`Token ${tokenId} might not exist or tokenURI failed:`, err);
                return null;
              }
            })()
          );
        }

        const results = await Promise.all(nftPromises);
        const validNfts = results.filter((nft): nft is NFTItem => nft !== null);
        setNfts(validNfts);

      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTs();
  }, [collectionAddress, userAddress, showAll, maxItems]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="aspect-square bg-gray-600 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-600 rounded mb-1"></div>
            <div className="h-3 bg-gray-600 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">Error loading NFTs</div>
        <div className="text-gray-500 text-sm">{error}</div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          {showAll ? 'No NFTs minted yet' : 'You don\'t own any NFTs from this collection'}
        </div>
        <div className="text-gray-500 text-sm">
          {showAll ? 'Be the first to mint!' : 'Mint some NFTs to see them here'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">
          {showAll ? 'Collection Gallery' : 'Your NFTs'} ({nfts.length})
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {nfts.map((nft) => (
          <div key={nft.tokenId} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
            <NFTImage
              tokenUri={nft.tokenUri}
              alt={`NFT #${nft.tokenId}`}
              width={200}
              height={200}
              showMetadata={true}
              className="mb-2"
            />
            <div className="text-center">
              <div className="text-white font-medium text-sm">#{nft.tokenId}</div>
              <div className="text-gray-400 text-xs truncate" title={nft.owner}>
                Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}