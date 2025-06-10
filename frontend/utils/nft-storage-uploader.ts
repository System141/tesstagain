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
 * Validate API key format
 */
function validateApiKey(apiKey: string): void {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('NFT.Storage API key is required');
  }
  if (apiKey === 'your_nft_storage_api_key_here') {
    throw new Error('Please replace the placeholder with your actual NFT.Storage API key');
  }
}

/**
 * Upload file to IPFS via NFT.Storage
 */
export async function uploadToNFTStorage(file: File, apiKey: string): Promise<string> {
  validateApiKey(apiKey);
  
  if (!file) {
    throw new Error('File is required for upload');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('NFT.Storage API key is invalid or expired. Please check your API key.');
      }
      throw new Error(`NFT.Storage upload failed (${response.status}): ${errorText || response.statusText}`);
    }

    const result: NFTStorageResponse = await response.json();
    
    if (!result.value?.cid) {
      throw new Error('Invalid response from NFT.Storage - missing CID');
    }
    
    return result.value.cid;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`NFT.Storage upload error: ${error.message}`);
    }
    throw new Error('Unknown error occurred during NFT.Storage upload');
  }
}

/**
 * Upload JSON metadata to IPFS via NFT.Storage
 */
export async function uploadJSONToNFTStorage(metadata: object, apiKey: string): Promise<string> {
  validateApiKey(apiKey);
  
  if (!metadata) {
    throw new Error('Metadata object is required for upload');
  }

  try {
    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('NFT.Storage API key is invalid or expired. Please check your API key.');
      }
      throw new Error(`NFT.Storage metadata upload failed (${response.status}): ${errorText || response.statusText}`);
    }

    const result: NFTStorageResponse = await response.json();
    
    if (!result.value?.cid) {
      throw new Error('Invalid response from NFT.Storage - missing CID');
    }
    
    return result.value.cid;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`NFT.Storage metadata upload error: ${error.message}`);
    }
    throw new Error('Unknown error occurred during NFT.Storage metadata upload');
  }
}