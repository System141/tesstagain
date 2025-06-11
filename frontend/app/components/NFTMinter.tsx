'use client';

import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import Image from 'next/image';

interface NFTMinterProps {
  collectionAddress: string;
  collectionName: string;
}

const NFT_COLLECTION_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function NFTMinter({ collectionAddress, collectionName }: NFTMinterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nftMetadata, setNftMetadata] = useState({
    name: '',
    description: '',
    attributes: [{ trait_type: '', value: '' }]
  });
  // const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [mintStatus, setMintStatus] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadToPinata = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/pinata-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
      // setUploadedImageUrl(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMetadataToPinata = async (imageUrl: string): Promise<string | null> => {
    const metadata = {
      name: nftMetadata.name,
      description: nftMetadata.description,
      image: imageUrl,
      attributes: nftMetadata.attributes.filter(attr => attr.trait_type && attr.value)
    };

    try {
      const response = await fetch('/api/pinata-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error(`Metadata upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading metadata:', error);
      alert('Failed to upload metadata. Please try again.');
      return null;
    }
  };

  const mintNFT = async () => {
    if (!selectedFile || !nftMetadata.name) {
      alert('Please select an image and provide NFT details');
      return;
    }

    if (!window.ethereum) {
      alert('Please install MetaMask to mint NFTs');
      return;
    }

    setIsMinting(true);
    setMintStatus('Uploading image...');

    try {
      // Upload image to Pinata
      const imageUrl = await uploadToPinata();
      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      setMintStatus('Uploading metadata...');
      
      // Upload metadata to Pinata
      const metadataUrl = await uploadMetadataToPinata(imageUrl);
      if (!metadataUrl) {
        throw new Error('Failed to upload metadata');
      }

      setMintStatus('Minting NFT...');

      // Mint NFT
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(collectionAddress, NFT_COLLECTION_ABI, signer);

      const mintPrice = await contract.mintPrice();
      const tx = await contract.mint(1, { value: mintPrice });
      
      setMintStatus('Confirming transaction...');
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setMintStatus('NFT minted successfully! 🎉');
        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        setNftMetadata({ name: '', description: '', attributes: [{ trait_type: '', value: '' }] });
        // setUploadedImageUrl(null);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: unknown) {
      console.error('Error minting NFT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMintStatus(`Minting failed: ${errorMessage}`);
      alert(`Failed to mint NFT: ${errorMessage}`);
    } finally {
      setIsMinting(false);
    }
  };

  const addAttribute = () => {
    setNftMetadata(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setNftMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setNftMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Mint NFT to {collectionName}
      </h3>

      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            NFT Image *
          </label>
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
            {previewUrl ? (
              <div className="space-y-4">
                <Image 
                  src={previewUrl} 
                  alt="NFT Preview" 
                  className="max-w-full max-h-64 mx-auto rounded-lg"
                  width={256}
                  height={256}
                  style={{ objectFit: 'contain' }}
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    // setUploadedImageUrl(null);
                  }}
                  className="text-sm text-zinc-400 hover:text-white underline"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-4">🖼️</div>
                <p className="text-zinc-400 mb-4">
                  Drop your image here or click to browse
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-block bg-zinc-700 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-zinc-600 transition-colors"
                >
                  Select Image
                </label>
                <p className="text-xs text-zinc-500 mt-2">
                  Supported: JPG, PNG, GIF, SVG (Max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* NFT Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              NFT Name *
            </label>
            <input
              type="text"
              value={nftMetadata.name}
              onChange={(e) => setNftMetadata(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:border-zinc-500 focus:outline-none"
              placeholder="My Awesome NFT"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Description
          </label>
          <textarea
            value={nftMetadata.description}
            onChange={(e) => setNftMetadata(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:border-zinc-500 focus:outline-none"
            rows={3}
            placeholder="Describe your NFT..."
          />
        </div>

        {/* Attributes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-zinc-300">
              Attributes (Optional)
            </label>
            <button
              onClick={addAttribute}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + Add Attribute
            </button>
          </div>
          
          <div className="space-y-2">
            {nftMetadata.attributes.map((attr, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  placeholder="Trait (e.g., Color)"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  placeholder="Value (e.g., Blue)"
                />
                <button
                  onClick={() => removeAttribute(index)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mint Button */}
        <button
          onClick={mintNFT}
          disabled={!selectedFile || !nftMetadata.name || isUploading || isMinting}
          className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMinting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              {mintStatus}
            </span>
          ) : isUploading ? (
            'Uploading...'
          ) : (
            'Mint NFT'
          )}
        </button>

        {/* Status Messages */}
        {mintStatus && !isMinting && (
          <div className={`text-center p-3 rounded-lg ${
            mintStatus.includes('successfully') 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : mintStatus.includes('failed') 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {mintStatus}
          </div>
        )}
      </div>
    </div>
  );
}