// Pinata IPFS uploader utility for Jugiter NFT Launchpad
// Get free API key from https://pinata.cloud

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface PinataJSONResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Validate API credentials
 */
function validateCredentials(apiKey: string, secretKey: string): void {
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_pinata_api_key_here') {
    throw new Error('Valid Pinata API key is required');
  }
  if (!secretKey || secretKey.trim() === '' || secretKey === 'your_pinata_secret_key_here') {
    throw new Error('Valid Pinata secret key is required');
  }
}

/**
 * Upload file to IPFS via Pinata
 */
export async function uploadToPinata(file: File, apiKey: string, secretKey: string): Promise<string> {
  validateCredentials(apiKey, secretKey);
  
  if (!file) {
    throw new Error('File is required for upload');
  }

  const formData = new FormData();
  formData.append('file', file);
  
  // Optional: Add metadata
  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedBy: 'Jugiter',
      timestamp: new Date().toISOString()
    }
  });
  formData.append('pinataMetadata', metadata);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Pinata API credentials are invalid. Please check your API key and secret.');
      }
      throw new Error(`Pinata upload failed (${response.status}): ${errorText || response.statusText}`);
    }

    const result: PinataResponse = await response.json();
    
    if (!result.IpfsHash) {
      throw new Error('Invalid response from Pinata - missing IPFS hash');
    }
    
    return result.IpfsHash;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Pinata upload error: ${error.message}`);
    }
    throw new Error('Unknown error occurred during Pinata upload');
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadJSONToPinata(metadata: object, apiKey: string, secretKey: string): Promise<string> {
  validateCredentials(apiKey, secretKey);
  
  if (!metadata) {
    throw new Error('Metadata object is required for upload');
  }

  const pinataContent = {
    pinataContent: metadata,
    pinataMetadata: {
      name: 'NFT-Metadata',
      keyvalues: {
        uploadedBy: 'Jugiter',
        timestamp: new Date().toISOString(),
        type: 'nft-metadata'
      }
    }
  };

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
      body: JSON.stringify(pinataContent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Pinata API credentials are invalid. Please check your API key and secret.');
      }
      throw new Error(`Pinata JSON upload failed (${response.status}): ${errorText || response.statusText}`);
    }

    const result: PinataJSONResponse = await response.json();
    
    if (!result.IpfsHash) {
      throw new Error('Invalid response from Pinata - missing IPFS hash');
    }
    
    return result.IpfsHash;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Pinata metadata upload error: ${error.message}`);
    }
    throw new Error('Unknown error occurred during Pinata metadata upload');
  }
}

/**
 * Test Pinata API connection
 */
export async function testPinataConnection(apiKey: string, secretKey: string): Promise<boolean> {
  try {
    validateCredentials(apiKey, secretKey);
    
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}