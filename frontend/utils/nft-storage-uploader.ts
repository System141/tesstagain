// NFT.Storage IPFS uploader utility
// Get free API key from https://nft.storage

interface NFTStorageResponse {
  ok: boolean;
  value: {
    cid: string;
    size: number;
    created: string;
    type: string;
    scope: string;
    pin: {
      cid: string;
      name: string;
      origins: string[];
      meta: object;
    };
    files: Array<{
      name: string;
      type: string;
    }>;
    deals: any[];
  };
}

/**
 * Upload file to IPFS via NFT.Storage
 */
export async function uploadToNFTStorage(file: File, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.nft.storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`NFT.Storage upload failed: ${response.statusText}`);
  }

  const result: NFTStorageResponse = await response.json();
  return result.value.cid;
}

/**
 * Upload JSON metadata to IPFS via NFT.Storage
 */
export async function uploadJSONToNFTStorage(metadata: object, apiKey: string): Promise<string> {
  const response = await fetch('https://api.nft.storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    throw new Error(`NFT.Storage metadata upload failed: ${response.statusText}`);
  }

  const result: NFTStorageResponse = await response.json();
  return result.value.cid;
}