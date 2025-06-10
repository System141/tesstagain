// Infura IPFS uploader utility
// Get API key from https://infura.io/product/ipfs

interface InfuraResponse {
  Name: string;
  Hash: string;
  Size: string;
}

/**
 * Upload file to IPFS via Infura
 */
export async function uploadToInfura(file: File, projectId: string, projectSecret: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const auth = btoa(`${projectId}:${projectSecret}`);

  const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Infura upload failed: ${response.statusText}`);
  }

  const result: InfuraResponse = await response.json();
  return result.Hash;
}

/**
 * Upload JSON metadata to IPFS via Infura
 */
export async function uploadJSONToInfura(metadata: object, projectId: string, projectSecret: string): Promise<string> {
  const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', blob, 'metadata.json');

  const auth = btoa(`${projectId}:${projectSecret}`);

  const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Infura metadata upload failed: ${response.statusText}`);
  }

  const result: InfuraResponse = await response.json();
  return result.Hash;
}