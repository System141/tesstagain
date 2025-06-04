import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, EventLog, Log } from 'ethers';
import NFTCollectionCard from './NFTCollectionCard';

const FACTORY_ADDRESS = '0xe553934B8AD246a45785Ea080d53024aAbd39189';
const FACTORY_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "collectionAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "CollectionCreated",
    "type": "event"
  }
] as const;

interface Collection {
  address: string;
  name: string;
  symbol: string;
  owner?: string;
}

export default function NFTCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollections();
    // Her 60 saniyede bir koleksiyonları güncelle
    const interval = setInterval(loadCollections, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadCollections() {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      // Son 10000 bloğu tara
      const filter = contract.filters.CollectionCreated();
      const events = await contract.queryFilter(filter, -10000);

      const newCollections = events
        .filter((event): event is EventLog => {
          return 'args' in event && Array.isArray(event.args) && event.args.length >= 4;
        })
        .map(event => ({
          address: event.args[0],
          name: event.args[1],
          symbol: event.args[2],
          // owner: event.args[3]
        }));

      setCollections(newCollections);
    } catch (error) {
      console.error('Koleksiyonlar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Koleksiyonlar yükleniyor...</p>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Henüz hiç koleksiyon oluşturulmamış.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map(collection => (
        <NFTCollectionCard
          key={collection.address}
          address={collection.address}
        />
      ))}
    </div>
  );
} 