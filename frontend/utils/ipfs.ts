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

// Multiple IPFS gateways for reliability (ordered by rate limit tolerance)
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',                 // Gateway 1 - Most reliable
  'https://dweb.link/ipfs/',               // Gateway 2 - Good fallback
  'https://cf-ipfs.com/ipfs/',             // Gateway 3 - Cloudflare backed
  'https://gateway.ipfs.io/ipfs/',         // Gateway 4 - Official
  'https://ipfs.filebase.io/ipfs/',        // Gateway 5 - Professional
  'https://4everland.io/ipfs/',            // Gateway 6 - Web3 storage
  'https://gateway.pinata.cloud/ipfs/'     // Gateway 7 - Last resort (rate limited)
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
 * Get the primary IPFS gateway URL for an IPFS URI (CORS-friendly)
 */
export function getIpfsUrl(ipfsUri: string): string {
  if (!ipfsUri) return '';
  
  // Handle both ipfs:// and direct hash formats
  let hash = ipfsUri;
  if (ipfsUri.startsWith('ipfs://')) {
    hash = ipfsUri.replace('ipfs://', '');
  }
  
  // Remove trailing slash if present
  hash = hash.replace(/\/$/, '');
  
  // Use ipfs.io first as it has better rate limits
  return `https://ipfs.io/ipfs/${hash}`;
}

/**
 * Fetch NFT metadata from IPFS using proxy with retry logic
 */
export async function fetchNFTMetadata(tokenUri: string): Promise<NFTMetadata | null> {
  if (!tokenUri) return null;
  
  // Try multiple gateways with retry logic
  const urls = convertIpfsToHttp(tokenUri);
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    try {
      console.log(`Fetching metadata via proxy (attempt ${i + 1}):`, tokenUri);
      
      const proxyResponse = await fetch(`/api/ipfs?url=${encodeURIComponent(url)}`, {
        method: 'GET'
      });
      
      if (proxyResponse.ok) {
        const contentType = proxyResponse.headers.get('content-type') || '';
        
        // Check if response is actually JSON
        if (contentType.includes('application/json')) {
          const metadata = await proxyResponse.json();
          console.log('Successfully fetched metadata via proxy:', tokenUri);
          return metadata as NFTMetadata;
        } else {
          // If not JSON, this might be an image file directly
          console.log('Response is not JSON metadata, might be direct image:', tokenUri);
          throw new Error('Expected JSON metadata but got ' + contentType);
        }
      } else {
        console.error(`Proxy response not ok (gateway ${i + 1}):`, proxyResponse.status, proxyResponse.statusText);
        
        // If rate limited, try next gateway immediately
        if (proxyResponse.status === 429) {
          continue;
        }
        
        // For other errors, only try a few more gateways
        if (i >= 2) break;
      }
    } catch (error) {
      console.error(`Failed to fetch metadata via proxy (gateway ${i + 1}):`, error);
      
      // If this looks like a JSON parsing error on image data, stop trying
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        console.log('Detected direct image file instead of metadata, stopping attempts');
        break;
      }
      
      // Try next gateway
      if (i < urls.length - 1) {
        continue;
      }
    }
  }
  
  console.error('All gateway attempts failed for:', tokenUri);
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
  
  // For other gateways, return plain URL
  return url;
}