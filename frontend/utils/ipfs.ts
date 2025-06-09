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

// Multiple IPFS gateways for reliability (ordered by performance)
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',    // Gateway 1 - Working
  'https://ipfs.io/ipfs/',                 // Gateway 2 - Working  
  'https://dweb.link/ipfs/',               // Gateway 4 - Working
  'https://cf-ipfs.com/ipfs/',             // Gateway 5 - Working
  'https://gateway.ipfs.io/ipfs/',         // Gateway 6 - Working
  'https://ipfs.filebase.io/ipfs/',        // Gateway 7 - Working
  'https://4everland.io/ipfs/'             // Gateway 8 - Working
  // Removed cloudflare-ipfs.com - was failing (Gateway 3)
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
 * Fetch NFT metadata from IPFS with fallback gateways and proxy
 */
export async function fetchNFTMetadata(tokenUri: string): Promise<NFTMetadata | null> {
  if (!tokenUri) return null;
  
  // First try using the local proxy (which might have better network access)
  try {
    const primaryUrl = getIpfsUrl(tokenUri);
    const proxyResponse = await fetch(`/api/ipfs?url=${encodeURIComponent(primaryUrl)}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=3600'
      }
    });
    
    if (proxyResponse.ok) {
      const metadata = await proxyResponse.json();
      console.log('Successfully fetched metadata via proxy:', tokenUri);
      return metadata as NFTMetadata;
    }
  } catch (error) {
    console.warn('Proxy fetch failed, trying direct gateways:', error);
  }
  
  // Fallback to direct gateway access
  const urls = convertIpfsToHttp(tokenUri);
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=3600'
        }
      });
      
      if (response.ok) {
        const metadata = await response.json();
        console.log('Successfully fetched metadata via direct gateway:', url);
        return metadata as NFTMetadata;
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata from ${url}:`, error);
      continue;
    }
  }
  
  console.error('Failed to fetch metadata from all sources for:', tokenUri);
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