import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getOptimizedImageUrl, fetchNFTMetadata } from '../../utils/ipfs';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface NFTImageProps {
  tokenUri?: string;
  imageUri?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  showMetadata?: boolean;
}

export default function NFTImage({ 
  tokenUri, 
  imageUri, 
  alt, 
  className = '', 
  width = 300, 
  height = 300,
  showMetadata = false 
}: NFTImageProps) {
  const [finalImageUrl, setFinalImageUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadImage() {
      setIsLoading(true);
      setError(null);

      try {
        let imageUrl = '';

        // If direct imageUri is provided, use it
        if (imageUri) {
          imageUrl = getOptimizedImageUrl(imageUri, width);
        }
        // If tokenUri is provided, fetch metadata first
        else if (tokenUri) {
          const metadataResult = await fetchNFTMetadata(tokenUri);
          if (metadataResult) {
            setMetadata(metadataResult);
            imageUrl = getOptimizedImageUrl(metadataResult.image, width);
          } else {
            throw new Error('Failed to fetch metadata');
          }
        }

        if (imageUrl) {
          // Test if image is accessible
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            setFinalImageUrl(imageUrl);
          } else {
            throw new Error('Image not accessible');
          }
        } else {
          throw new Error('No image URL available');
        }
      } catch (err) {
        console.error('Error loading NFT image:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setIsLoading(false);
      }
    }

    if (tokenUri || imageUri) {
      loadImage();
    } else {
      setIsLoading(false);
      setError('No image source provided');
    }
  }, [tokenUri, imageUri, width]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 animate-pulse ${className}`} style={{ width, height }}>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !finalImageUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 border-2 border-dashed border-gray-600 ${className}`} style={{ width, height }}>
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-2">🖼️</div>
          <div className="text-xs">No Image</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={finalImageUrl}
          alt={alt}
          width={width}
          height={height}
          className="object-cover transition-transform hover:scale-105"
          onError={() => setError('Failed to load image')}
          priority={false}
        />
      </div>
      {showMetadata && metadata && (
        <div className="mt-2 text-sm">
          <h4 className="font-semibold text-white">{metadata.name}</h4>
          {metadata.description && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{metadata.description}</p>
          )}
        </div>
      )}
    </div>
  );
}