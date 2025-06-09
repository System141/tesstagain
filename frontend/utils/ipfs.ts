// IPFS utility functions for Jugiter NFT Launchpad

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

// Multiple IPFS gateways for reliability
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

/**
 * Convert IPFS URI to HTTP URLs using multiple gateways
 */
export function convertIpfsToHttp(ipfsUri: string): string[] {
  if (!ipfsUri) return [];
  
  // Handle both ipfs:// and direct hash formats
  let hash = ipfsUri;
  if (ipfsUri.startsWith('ipfs://')) {
    hash = ipfsUri.replace('ipfs://', '');
  }
  
  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}

/**
 * Get the primary IPFS gateway URL for an IPFS URI
 */
export function getIpfsUrl(ipfsUri: string): string {
  const urls = convertIpfsToHttp(ipfsUri);
  return urls[0] || '';
}

/**
 * Fetch NFT metadata from IPFS with fallback gateways
 */
export async function fetchNFTMetadata(tokenUri: string): Promise<NFTMetadata | null> {
  if (!tokenUri) return null;
  
  const urls = convertIpfsToHttp(tokenUri);
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=3600' // 1 hour cache
        }
      });
      
      if (response.ok) {
        const metadata = await response.json();
        return metadata as NFTMetadata;
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata from ${url}:`, error);
      continue;
    }
  }
  
  console.error('Failed to fetch metadata from all gateways for:', tokenUri);
  return null;
}

/**
 * Get collection metadata from baseURI (typically baseURI + "1.json" for first token)
 */
export async function fetchCollectionMetadata(baseUri: string, tokenId: number = 1): Promise<NFTMetadata | null> {
  if (!baseUri) return null;
  
  // Handle baseURI formats: "ipfs://hash/" or "ipfs://hash/metadata.json"
  let metadataUri = baseUri;
  
  // If baseURI ends with "/", append token ID
  if (baseUri.endsWith('/')) {
    metadataUri = `${baseUri}${tokenId}.json`;
  } else if (!baseUri.includes('.json')) {
    // If no .json extension, add tokenId
    metadataUri = `${baseUri}/${tokenId}.json`;
  }
  
  return fetchNFTMetadata(metadataUri);
}

/**
 * Check if an IPFS URL is accessible
 */
export async function testIpfsGateway(ipfsUri: string, timeoutMs: number = 5000): Promise<boolean> {
  const url = getIpfsUrl(ipfsUri);
  if (!url) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get optimized image URL for NFT display
 */
export function getOptimizedImageUrl(imageUri: string, width?: number): string {
  const url = getIpfsUrl(imageUri);
  
  // For Pinata gateway, we can add optimization parameters
  if (url.includes('gateway.pinata.cloud') && width) {
    return `${url}?img-width=${width}&img-format=webp`;
  }
  
  return url;
}