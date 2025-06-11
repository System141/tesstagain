import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import NFTImage from './NFTImage';
import NFTGallery from './NFTGallery';
import DebugInfo from './DebugInfo';

// ABI for the individual NFTCollection contract
// This should be the ABI of the `NFTCollection` contract, not the factory.
const NFT_COLLECTION_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_symbol",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_initialBaseURI",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_maxSupply",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_publicMintPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxPerWallet",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_allowlistMintPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_allowlistDurationSeconds",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "_allowlistedAddresses",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "_maxPerAllowlistWallet",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721IncorrectOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721InsufficientApproval",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOperator",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721NonexistentToken",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "baseURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_newBaseURI",
        "type": "string"
      }
    ],
    "name": "setBaseURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_active",
        "type": "bool"
      }
    ],
    "name": "toggleAllowlist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_newEndTime",
        "type": "uint256"
      }
    ],
    "name": "setAllowlistEndTime",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
   {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_newPrice",
        "type": "uint256"
      }
    ],
    "name": "setAllowlistMintPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_max",
        "type": "uint256"
      }
    ],
    "name": "setMaxPerAllowlistWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_addresses",
        "type": "address[]"
      },
      {
        "internalType": "bool[]",
        "name": "_isAllowed",
        "type": "bool[]"
      }
    ],
    "name": "updateAllowlist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "allowlistActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "allowlistClaimed",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "allowlistEndTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "allowlistMintPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isAllowlisted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isRevealed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxPerAllowlistWallet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxPerWallet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface CollectionDetails {
  name: string;
  symbol: string;
  totalSupply: bigint;
  maxSupply: bigint;
  publicMintPrice: bigint;
  allowlistActive: boolean;
  allowlistMintPrice: bigint;
  allowlistEndTime: bigint;
  // User specific and limits
  maxPerWallet: bigint;
  maxPerAllowlistWallet: bigint;
  isCurrentUserAllowlisted?: boolean;
  currentUserAllowlistClaimed?: bigint;
  currentUserPublicMinted?: bigint; // To track balance for public mint
  baseURI?: string; // Added baseURI for potential image display
}

interface NFTCollectionCardProps {
  address: string;
  // name and symbol are now fetched from contract details
}



export default function NFTCollectionCard({ address }: NFTCollectionCardProps) {
  const [details, setDetails] = useState<CollectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  // Combined data fetching logic
  async function fetchData() {
    if (!window.ethereum || !address) return;
    // Keep isLoading true only on initial load or explicit refresh trigger
    // setError(null); // Clear previous errors before new fetch

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const connectedAddress = await signer.getAddress();
      setCurrentUserAddress(connectedAddress);

      const contract = new Contract(address, NFT_COLLECTION_ABI, provider);

      const [
        name,
        symbol,
        totalSupply,
        maxSupply,
        publicMintPrice,
        allowlistActive,
        allowlistMintPrice,
        allowlistEndTime,
        maxPerWallet,
        maxPerAllowlistWallet,
        baseURI_value
      ] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
        contract.maxSupply(),
        contract.mintPrice(),
        contract.allowlistActive(),
        contract.allowlistMintPrice(),
        contract.allowlistEndTime(),
        contract.maxPerWallet(),
        contract.maxPerAllowlistWallet(),
        contract.baseURI()
      ]);

      let isCurrentUserAllowlisted = false;
      let currentUserAllowlistClaimed = BigInt(0);
      let currentUserPublicMinted = BigInt(0);

      if (connectedAddress) {
        if (allowlistActive) {
          isCurrentUserAllowlisted = await contract.isAllowlisted(connectedAddress);
          currentUserAllowlistClaimed = await contract.allowlistClaimed(connectedAddress);
        }
        currentUserPublicMinted = await contract.balanceOf(connectedAddress);
      }

      setDetails({
        name,
        symbol,
        totalSupply,
        maxSupply,
        publicMintPrice,
        allowlistActive,
        allowlistMintPrice,
        allowlistEndTime,
        maxPerWallet,
        maxPerAllowlistWallet,
        isCurrentUserAllowlisted,
        currentUserAllowlistClaimed,
        currentUserPublicMinted,
        baseURI: baseURI_value
      });
    } catch (err: unknown) {
      console.error(`Error fetching details for ${address}:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load collection details. ${errorMessage}`);
    } finally {
      setIsLoading(false); // Set loading to false after fetch attempt
    }
  }

  useEffect(() => {
    setIsLoading(true); // Set loading true on initial mount and address change
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Minting Logic
  async function handleMint() {
    if (!details || !currentUserAddress || !window.ethereum) return;
    setMintError(null);
    setTransactionHash(null);
    setIsLoading(true); // Use a separate loading state for minting if preferred

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(address, NFT_COLLECTION_ABI, signer);

      let pricePerToken = BigInt(0);
      const mintFunctionName = 'mint'; // Default to public mint function name

      const now = BigInt(Math.floor(Date.now() / 1000));
      const isAllowlistStageActive = details.allowlistActive && details.allowlistEndTime > now;
      
      if (isAllowlistStageActive && details.isCurrentUserAllowlisted) {
        if ((details.currentUserAllowlistClaimed || BigInt(0)) + BigInt(quantity) <= details.maxPerAllowlistWallet) {
          pricePerToken = details.allowlistMintPrice;
          // The contract's mint function handles allowlist logic internally based on msg.sender and time
        } else {
          throw new Error('Exceeds max per allowlist wallet or not eligible.');
        }
      } else if (!isAllowlistStageActive || (details.allowlistActive && details.allowlistEndTime <= now)) {
        // Public mint stage (either allowlist never existed, or it ended)
         if ((details.currentUserPublicMinted || BigInt(0)) + BigInt(quantity) <= details.maxPerWallet) {
            pricePerToken = details.publicMintPrice;
        } else {
          throw new Error('Exceeds max per wallet for public mint.');
        }
      } else {
        throw new Error('Not eligible for any active mint stage.');
      }

      if (details.totalSupply + BigInt(quantity) > details.maxSupply) {
        throw new Error('Exceeds max supply.');
      }

      const totalPrice = pricePerToken * BigInt(quantity);
      const tx = await contract[mintFunctionName](quantity, { value: totalPrice });
      setTransactionHash(tx.hash);
      await tx.wait();
      alert('Mint successful!');
      fetchData(); // Refresh data after mint
    } catch (err: unknown) {
      console.error('Error during mint operation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Mint failed. Check console.';
      setMintError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && !details) { // Show loading only on initial data fetch
    return <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white">Loading collection...</div>;
  }
  if (error) {
    return <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-red-400">Error: {error}</div>;
  }
  if (!details) {
    return <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white">No details available.</div>;
  }

  // Determine mint stage status and eligibility
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isAllowlistTimeActive = details.allowlistActive && details.allowlistEndTime > now;
  const isAllowlistStageOverallActive = details.allowlistActive && details.isCurrentUserAllowlisted && isAllowlistTimeActive && (details.currentUserAllowlistClaimed || BigInt(0)) < details.maxPerAllowlistWallet;
  
  const canMintAllowlist = isAllowlistStageOverallActive && (details.currentUserAllowlistClaimed || BigInt(0)) + BigInt(quantity) <= details.maxPerAllowlistWallet;

  const isPublicStageActive = !isAllowlistTimeActive || !details.allowlistActive; // Public is active if allowlist is not, or never was
  const canMintPublic = isPublicStageActive && (details.currentUserPublicMinted || BigInt(0)) + BigInt(quantity) <= details.maxPerWallet && details.totalSupply < details.maxSupply;

  let mintButtonText = "Mint Not Available";
  let isButtonDisabled = true;
  let maxMintableThisStage = BigInt(0);

  if (details.totalSupply >= details.maxSupply) {
    mintButtonText = "Sold Out";
    isButtonDisabled = true;
  } else if (isAllowlistStageOverallActive) {
    mintButtonText = `Mint Allowlist (${formatEther(details.allowlistMintPrice)} ETH)`;
    isButtonDisabled = !canMintAllowlist;
    if(canMintAllowlist) maxMintableThisStage = details.maxPerAllowlistWallet - (details.currentUserAllowlistClaimed || BigInt(0));
  } else if (isPublicStageActive) {
    mintButtonText = `Mint Public (${formatEther(details.publicMintPrice)} ETH)`;
    isButtonDisabled = !canMintPublic;
    if(canMintPublic) maxMintableThisStage = details.maxPerWallet - (details.currentUserPublicMinted || BigInt(0));
  }
  
  const remainingSupplyInStage = maxMintableThisStage > details.maxSupply - details.totalSupply ? details.maxSupply - details.totalSupply : maxMintableThisStage;
  const maxQuantityForInput = remainingSupplyInStage > BigInt(0) ? Number(remainingSupplyInStage) : 1;


  const mintProgress = details.maxSupply > 0 ? (Number(details.totalSupply) / Number(details.maxSupply)) * 100 : 0;

  return (
    <div className="magic-card magic-card-hover rounded-2xl overflow-hidden shadow-2xl text-white group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-500/10">
      {/* Collection Header */}
      <div className="relative">
        {/* Collection Cover/Banner */}
        <div className="h-48 bg-gradient-to-br from-violet-600/30 to-cyan-600/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
          
          {/* Collection Avatar */}
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-xl border-4 border-zinc-900 overflow-hidden bg-zinc-800">
              <NFTImage
                tokenUri={details.baseURI}
                alt={`${details.name} collection image`}
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            {details.totalSupply >= details.maxSupply ? (
              <span className="px-3 py-1 bg-red-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                Sold Out
              </span>
            ) : isAllowlistTimeActive ? (
              <span className="px-3 py-1 bg-violet-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                Allowlist Live
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                Public Live
              </span>
            )}
          </div>
        </div>

        {/* Collection Info */}
        <div className="p-6 pt-12">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-100 truncate mb-1" title={details.name}>{details.name}</h3>
            <p className="text-sm text-zinc-400 font-medium">{details.symbol}</p>
          </div>
          
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
              <div className="text-xs text-zinc-400 mb-1">Floor Price</div>
              <div className="text-lg font-bold text-violet-400">
                {formatEther(details.allowlistActive && details.allowlistEndTime > BigInt(Math.floor(Date.now() / 1000)) ? details.allowlistMintPrice : details.publicMintPrice)} ETH
              </div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
              <div className="text-xs text-zinc-400 mb-1">Total Supply</div>
              <div className="text-lg font-bold text-zinc-200">{Number(details.maxSupply).toLocaleString()}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
              <div className="text-xs text-zinc-400 mb-1">Minted</div>
              <div className="text-lg font-bold text-emerald-400">{Number(details.totalSupply)}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
              <div className="text-xs text-zinc-400 mb-1">Progress</div>
              <div className="text-lg font-bold text-cyan-400">{mintProgress.toFixed(1)}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-400">Mint Progress</span>
              <span className="text-sm text-zinc-300">{Number(details.totalSupply)} / {Number(details.maxSupply)}</span>
            </div>
            <div className="magic-progress h-2">
              <div 
                className="magic-progress-bar h-full rounded-full"
                style={{ width: `${mintProgress.toFixed(2)}%` }}
              ></div>
            </div>
          </div>

          {/* Mint Phases Compact */}
          <div className="flex gap-2 mb-6">
            {details.allowlistActive && (
              <div className={`flex-1 p-3 rounded-lg border text-center ${isAllowlistTimeActive ? 'bg-violet-500/10 border-violet-500/30' : 'bg-zinc-800/30 border-zinc-700/50 opacity-60'}`}>
                <div className="text-xs text-violet-300 mb-1">Allowlist</div>
                <div className="text-sm font-semibold text-white">{formatEther(details.allowlistMintPrice)} ETH</div>
                <div className="text-xs text-zinc-400">Max {Number(details.maxPerAllowlistWallet)}</div>
              </div>
            )}
            <div className={`flex-1 p-3 rounded-lg border text-center ${isPublicStageActive ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-zinc-800/30 border-zinc-700/50 opacity-60'}`}>
              <div className="text-xs text-cyan-300 mb-1">Public</div>
              <div className="text-sm font-semibold text-white">{formatEther(details.publicMintPrice)} ETH</div>
              <div className="text-xs text-zinc-400">Max {Number(details.maxPerWallet)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Minting Controls */}
      <div className="p-6 pt-0 border-t border-zinc-800">
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label htmlFor={`quantity-${address}`} className="block text-xs font-medium text-zinc-400 mb-2">Quantity</label>
            <input 
              type="number" 
              id={`quantity-${address}`}
              value={quantity}
              min="1"
              max={maxQuantityForInput > 0 ? maxQuantityForInput : 1}
              onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value), maxQuantityForInput > 0 ? maxQuantityForInput : 1)) )}
              disabled={isButtonDisabled || details.totalSupply >= details.maxSupply}
              className="magic-input w-full text-center disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-400 mb-2">Total Cost</label>
            <div className="magic-input bg-zinc-800 text-center flex items-center justify-center">
              <span className="text-violet-400 font-semibold">
                {formatEther((isAllowlistStageOverallActive ? details.allowlistMintPrice : details.publicMintPrice) * BigInt(quantity))} ETH
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleMint}
          disabled={isButtonDisabled || isLoading}
          className="magic-button w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && !details ? (
            <span>Loading...</span>
          ) : isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <span className="text-xl">⚡</span>
              {mintButtonText}
            </>
          )}
        </button>

        {transactionHash && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-xs text-emerald-400 text-center">
              ✅ Mint successful! 
              <a href={`https://sepolia.etherscan.io/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                View on Etherscan
              </a>
            </p>
          </div>
        )}
        
        {mintError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400 text-center">❌ {mintError}</p>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          {details.totalSupply > 0 && (
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="flex-1 magic-button-secondary text-sm py-2"
            >
              {showGallery ? '👁️ Hide' : `🖼️ Gallery (${Number(details.totalSupply)})`}
            </button>
          )}
          <button className="flex-1 magic-button-secondary text-sm py-2">
            📊 Analytics
          </button>
        </div>
      </div>
      
      {/* NFT Gallery */}
      {showGallery && (
        <div className="mt-6 pt-6 border-t border-zinc-700">
          <NFTGallery
            collectionAddress={address}
            userAddress={currentUserAddress}
            showAll={true}
            maxItems={8}
          />
        </div>
      )}
      
      {/* Debug Info */}
      <DebugInfo 
        collectionAddress={address}
        baseURI={details.baseURI}
      />
    </div>
  );
} 