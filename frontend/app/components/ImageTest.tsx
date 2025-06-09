import { useState } from 'react';
import NFTImage from './NFTImage';

export default function ImageTest() {
  const [showTest, setShowTest] = useState(false);
  
  // Test IPFS URLs - you can replace these with actual IPFS hashes you know exist
  const testImages = [
    'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', // Sample NFT metadata
    'ipfs://QmSgvzxwxGcov1ZPTzfxY8FDy8oTqGUAp8Qs8Q2HpBx6dG'  // Sample direct image
  ];

  if (!showTest) {
    return (
      <div className="fixed bottom-4 right-4">
        <button 
          onClick={() => setShowTest(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          Test IPFS Images
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-bold">IPFS Image Test</h3>
          <button 
            onClick={() => setShowTest(false)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testImages.map((ipfsUri, i) => (
            <div key={i} className="bg-gray-700 p-4 rounded">
              <div className="text-white text-sm mb-2">Test Image {i + 1}</div>
              <div className="text-gray-400 text-xs mb-2 break-all">{ipfsUri}</div>
              <NFTImage
                tokenUri={ipfsUri}
                alt={`Test image ${i + 1}`}
                width={200}
                height={200}
                showMetadata={true}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-gray-400 text-sm">
          <p>If these test images don't load, the issue is with IPFS gateway access.</p>
          <p>If they do load, the issue is that your collections don't have images uploaded.</p>
        </div>
      </div>
    </div>
  );
}