import { useState, useCallback } from 'react';
import { uploadToNFTStorage, uploadJSONToNFTStorage } from '../../utils/nft-storage-uploader';

interface ImageUploaderProps {
  onUploadComplete: (baseURI: string) => void;
  nftStorageKey: string;
}

export default function ImageUploader({ onUploadComplete, nftStorageKey }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const createAndUploadMetadata = async (imageHash: string) => {
    const metadata = {
      name: "NFT Collection",
      description: "Your NFT Collection Description",
      image: `ipfs://${imageHash}`,
      external_url: "",
      attributes: []
    };

    try {
      return await uploadJSONToNFTStorage(metadata, nftStorageKey);
    } catch (error) {
      console.error('NFT.Storage metadata upload error:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      // Upload image to NFT.Storage
      const imageHash = await uploadToNFTStorage(selectedImage, nftStorageKey);
      
      // Upload metadata to NFT.Storage
      const metadataHash = await createAndUploadMetadata(imageHash);
      
      // Create IPFS URI (without trailing slash for direct metadata access)
      const baseURI = `ipfs://${metadataHash}`;
      
      onUploadComplete(baseURI);
    } catch (error) {
      console.error('NFT.Storage upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
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
          disabled={isUploading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isUploading ? 'Uploading to NFT.Storage...' : 'Upload to IPFS'}
        </button>
      )}
    </div>
  );
} 