import { useState } from 'react';

interface DebugInfoProps {
  collectionAddress?: string;
  baseURI?: string;
}

export default function DebugInfo({ collectionAddress, baseURI }: DebugInfoProps) {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        className="text-xs text-gray-500 hover:text-gray-300 mt-2"
      >
        Debug Info
      </button>
    );
  }

  const testUrls = baseURI ? [
    `https://gateway.pinata.cloud/ipfs/${baseURI.replace('ipfs://', '')}`,
    `https://ipfs.io/ipfs/${baseURI.replace('ipfs://', '')}`,
    `https://cloudflare-ipfs.com/ipfs/${baseURI.replace('ipfs://', '')}`
  ] : [];

  return (
    <div className="mt-4 p-3 bg-gray-900 rounded text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-medium">Debug Info</span>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1 text-gray-300">
        <div><span className="text-gray-500">Collection:</span> {collectionAddress}</div>
        <div><span className="text-gray-500">BaseURI:</span> {baseURI || 'Not set'}</div>
        
        {baseURI && baseURI.startsWith('ipfs://') && (
          <div className="mt-2">
            <div className="text-gray-500 mb-1">Test these URLs manually:</div>
            {testUrls.map((url, i) => (
              <div key={i}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  Gateway {i + 1}
                </a>
              </div>
            ))}
          </div>
        )}
        
        {!baseURI && (
          <div className="text-yellow-400 mt-2">
            ⚠️ No baseURI set - collection was created without an image
          </div>
        )}
      </div>
    </div>
  );
}