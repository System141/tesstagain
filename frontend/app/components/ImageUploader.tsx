import { useState, useCallback } from 'react';
import axios from 'axios';

interface ImageUploaderProps {
  onUploadComplete: (baseURI: string) => void;
  pinataApiKey: string;
  pinataSecretKey: string;
}

export default function ImageUploader({ onUploadComplete, pinataApiKey, pinataSecretKey }: ImageUploaderProps) {
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

  const uploadToPinata = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name: 'NFT Collection Image',
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          'Content-Type': `multipart/form-data;`,
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey
        }
      });

      return res.data.IpfsHash;
    } catch (error) {
      console.error('Pinata yükleme hatası:', error);
      throw error;
    }
  };

  const createAndUploadMetadata = async (imageHash: string) => {
    const metadata = {
      name: "NFT Collection",
      description: "Your NFT Collection Description",
      image: `ipfs://${imageHash}`,
      external_url: "",
      attributes: []
    };

    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey
        }
      });

      return res.data.IpfsHash;
    } catch (error) {
      console.error('Metadata yükleme hatası:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      // Görseli yükle
      const imageHash = await uploadToPinata(selectedImage);
      
      // Metadata'yı yükle
      const metadataHash = await createAndUploadMetadata(imageHash);
      
      // IPFS URI'yi oluştur
      const baseURI = `ipfs://${metadataHash}/`;
      
      onUploadComplete(baseURI);
    } catch (error) {
      console.error('Yükleme hatası:', error);
      alert('Görsel yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
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
              <p className="text-gray-500">Görsel seçmek için tıklayın</p>
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
          {isUploading ? 'Yükleniyor...' : 'IPFS\'e Yükle'}
        </button>
      )}
    </div>
  );
} 