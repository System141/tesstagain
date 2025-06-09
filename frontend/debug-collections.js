// Debug script to check existing NFT collections
const { ethers } = require('ethers');

const FACTORY_ADDRESS = '0xe553934B8AD246a45785Ea080d53024aAbd39189';
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'; // Public RPC

const FACTORY_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "address", "name": "collectionAddress", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "symbol", "type": "string"},
      {"indexed": false, "internalType": "address", "name": "creator", "type": "address"}
    ],
    "name": "CollectionCreated",
    "type": "event"
  }
];

const COLLECTION_ABI = [
  {
    "inputs": [],
    "name": "baseURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function debugCollections() {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    console.log('🔍 Fetching collection events...');
    
    // Get all CollectionCreated events
    const events = await factory.queryFilter('CollectionCreated', -10000, 'latest');
    
    console.log(`📊 Found ${events.length} collections:`);
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const collectionAddress = event.args.collectionAddress;
      const name = event.args.name;
      const symbol = event.args.symbol;
      const creator = event.args.creator;
      
      console.log(`\n📋 Collection ${i + 1}:`);
      console.log(`  Address: ${collectionAddress}`);
      console.log(`  Name: ${name} (${symbol})`);
      console.log(`  Creator: ${creator}`);
      
      try {
        const collection = new ethers.Contract(collectionAddress, COLLECTION_ABI, provider);
        const baseURI = await collection.baseURI();
        const totalSupply = await collection.totalSupply();
        
        console.log(`  BaseURI: ${baseURI}`);
        console.log(`  Total Supply: ${totalSupply.toString()}`);
        
        if (baseURI && baseURI.startsWith('ipfs://')) {
          console.log(`  🖼️  Image should be at: https://gateway.pinata.cloud/ipfs/${baseURI.replace('ipfs://', '')}`);
        } else if (!baseURI) {
          console.log(`  ❌ No baseURI set - no image uploaded`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error fetching collection details: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCollections();