// Web3.Storage IPFS uploader utility
// Get free API key from https://web3.storage

interface Web3StorageResponse {
  cid: string;
}

/**
 * Upload file to IPFS via Web3.Storage
 */
export async function uploadToWeb3Storage(file: File, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Web3.Storage upload failed: ${response.statusText}`);
  }

  const result: Web3StorageResponse = await response.json();
  return result.cid;
}

/**
 * Upload JSON metadata to IPFS via Web3.Storage
 */
export async function uploadJSONToWeb3Storage(metadata: object, apiKey: string): Promise<string> {
  const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json', { type: 'application/json' });

  return uploadToWeb3Storage(file, apiKey);
}