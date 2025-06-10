import { useState, useCallback } from 'react';
import { uploadToWeb3Storage, uploadJSONToWeb3Storage } from '../../utils/web3-storage-uploader';
import { uploadToNFTStorage, uploadJSONToNFTStorage } from '../../utils/nft-storage-uploader';
import { uploadToInfura, uploadJSONToInfura } from '../../utils/infura-uploader';

interface MultiProviderImageUploaderProps {
  onUploadComplete: (baseURI: string) => void;
  // Provider credentials
  web3StorageKey?: string;
  nftStorageKey?: string;
  infuraProjectId?: string;
  infuraProjectSecret?: string;
}

type Provider = 'web3storage' | 'nftstorage' | 'infura';

export default function MultiProviderImageUploader({ 
  onUploadComplete, 
  web3StorageKey,
  nftStorageKey,
  infuraProjectId,
  infuraProjectSecret
}: MultiProviderImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('web3storage');

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const uploadWithProvider = async (file: File): Promise<string> => {
    switch (selectedProvider) {
      case 'web3storage':
        if (!web3StorageKey) throw new Error('Web3.Storage API key not provided');
        return uploadToWeb3Storage(file, web3StorageKey);
      
      case 'nftstorage':
        if (!nftStorageKey) throw new Error('NFT.Storage API key not provided');
        return uploadToNFTStorage(file, nftStorageKey);
      
      case 'infura':
        if (!infuraProjectId || !infuraProjectSecret) throw new Error('Infura credentials not provided');
        return uploadToInfura(file, infuraProjectId, infuraProjectSecret);
      
      default:
        throw new Error('Invalid provider selected');
    }
  };

  const uploadMetadataWithProvider = async (metadata: object): Promise<string> => {
    switch (selectedProvider) {
      case 'web3storage':
        if (!web3StorageKey) throw new Error('Web3.Storage API key not provided');
        return uploadJSONToWeb3Storage(metadata, web3StorageKey);
      
      case 'nftstorage':
        if (!nftStorageKey) throw new Error('NFT.Storage API key not provided');
        return uploadJSONToNFTStorage(metadata, nftStorageKey);
      
      case 'infura':
        if (!infuraProjectId || !infuraProjectSecret) throw new Error('Infura credentials not provided');
        return uploadJSONToInfura(metadata, infuraProjectId, infuraProjectSecret);
      
      default:
        throw new Error('Invalid provider selected');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      // Upload image
      const imageHash = await uploadWithProvider(selectedImage);
      
      // Create and upload metadata
      const metadata = {
        name: "NFT Collection",
        description: "Your NFT Collection Description",
        image: `ipfs://${imageHash}`,
        external_url: "",
        attributes: []
      };
      
      const metadataHash = await uploadMetadataWithProvider(metadata);
      
      // Create IPFS URI
      const baseURI = `ipfs://${metadataHash}`;
      
      onUploadComplete(baseURI);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const availableProviders = [
    { id: 'web3storage' as Provider, name: 'Web3.Storage', available: !!web3StorageKey },
    { id: 'nftstorage' as Provider, name: 'NFT.Storage', available: !!nftStorageKey },
    { id: 'infura' as Provider, name: 'Infura IPFS', available: !!(infuraProjectId && infuraProjectSecret) }
  ];

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">IPFS Provider</label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as Provider)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {availableProviders.map(provider => (
            <option 
              key={provider.id} 
              value={provider.id}
              disabled={!provider.available}
            >
              {provider.name} {!provider.available && '(credentials missing)'}
            </option>
          ))}
        </select>
      </div>

      {/* Image Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer block text-center"
        >
          {previewUrl ? (
            <div className="relative aspect-square w-full max-w-md mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="rounded-lg object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="py-8">
              <p className="text-gray-500">Click to select image</p>
              <p className="text-sm text-gray-400">PNG, JPG, GIF (max 10MB)</p>
            </div>
          )}
        </label>
      </div>

      {selectedImage && (
        <button
          onClick={handleUpload}
          disabled={isUploading || !availableProviders.find(p => p.id === selectedProvider)?.available}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isUploading ? `Uploading via ${selectedProvider}...` : `Upload to IPFS via ${selectedProvider}`}
        </button>
      )}
    </div>
  );
}