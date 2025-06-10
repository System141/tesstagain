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
    <div className="magic-card magic-card-hover p-6 rounded-xl shadow-xl text-white flex flex-col justify-between min-h-[600px]">
      <div> {/* Top section for info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-zinc-100 truncate mb-1" title={details.name}>{details.name}</h3>
          <p className="text-sm text-zinc-400 font-medium">{details.symbol}</p>
        </div>
        
        {/* Collection Image */}
        <div className="mb-6 flex justify-center">
          <NFTImage
            tokenUri={details.baseURI}
            alt={`${details.name} collection image`}
            className="rounded-lg overflow-hidden"
            width={250}
            height={250}
          />
        </div>
        
        {/* Key Metrics Section - Magic Eden Style */}
        <div className="mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Floor Price</span>
            <span className="magic-metrics text-violet-400">{formatEther(details.allowlistActive && details.allowlistEndTime > BigInt(Math.floor(Date.now() / 1000)) ? details.allowlistMintPrice : details.publicMintPrice)} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Total Supply</span>
            <span className="magic-metrics text-zinc-200">{Number(details.maxSupply).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Minted</span>
            <span className="magic-metrics text-zinc-200">{Number(details.totalSupply)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Progress</span>
            <span className="magic-metrics text-cyan-400">{mintProgress.toFixed(1)}%</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="magic-progress h-3 mb-2">
            <div 
              className="magic-progress-bar h-full"
              style={{ width: `${mintProgress.toFixed(2)}%` }}
            ></div>
          </div>
          <p className="text-xs text-zinc-500 text-center">{Number(details.totalSupply)} / {Number(details.maxSupply)} Minted</p>
        </div>

        {/* Mint Stages - Redesigned */}
        <div className="space-y-3 mb-6">
          {details.allowlistActive && (
            <div className={`p-4 rounded-lg border ${isAllowlistTimeActive ? 'bg-zinc-800/50 border-violet-500/30' : 'bg-zinc-800/30 border-zinc-700/50 opacity-70'}`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-violet-300">Allowlist Phase</h4>
                {isAllowlistTimeActive && details.isCurrentUserAllowlisted && <span className="px-2 py-1 text-xs bg-emerald-500 text-white rounded-full">✓ Eligible</span>}
                {isAllowlistTimeActive && !details.isCurrentUserAllowlisted && <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">✗ Not Eligible</span>}
                {!isAllowlistTimeActive && <span className="px-2 py-1 text-xs bg-zinc-600 text-white rounded-full">Ended</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">{formatEther(details.allowlistMintPrice)} ETH</span>
                <span className="text-xs text-zinc-500">Max: {Number(details.maxPerAllowlistWallet)}</span>
              </div>
            </div>
          )}
          <div className={`p-4 rounded-lg border ${isPublicStageActive ? 'bg-zinc-800/50 border-cyan-500/30' : 'bg-zinc-800/30 border-zinc-700/50 opacity-70'}`}>
             <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-cyan-300">Public Mint</h4>
                {isPublicStageActive && details.totalSupply < details.maxSupply && <span className="px-2 py-1 text-xs bg-cyan-500 text-white rounded-full">Live</span>}
                 {details.totalSupply >= details.maxSupply && <span className="px-2 py-1 text-xs bg-zinc-600 text-white rounded-full">Sold Out</span>}
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">{formatEther(details.publicMintPrice)} ETH</span>
                <span className="text-xs text-zinc-500">Max: {Number(details.maxPerWallet)}</span>
              </div>
          </div>
        </div>
      </div>

      {/* Bottom section for minting controls */}
      <div>
        <div className="mb-4">
          <label htmlFor={`quantity-${address}`} className="block text-sm font-medium text-zinc-300 mb-2">Quantity:</label>
          <input 
            type="number" 
            id={`quantity-${address}`}
            value={quantity}
            min="1"
            max={maxQuantityForInput > 0 ? maxQuantityForInput : 1} // Ensure max is at least 1
            onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value), maxQuantityForInput > 0 ? maxQuantityForInput : 1)) )}
            disabled={isButtonDisabled || details.totalSupply >= details.maxSupply}
            className="magic-input w-full disabled:opacity-50"
          />
        </div>

        <button 
          onClick={handleMint}
          disabled={isButtonDisabled || isLoading} // Disable also if any loading is active
          className="magic-button w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading && !details ? 'Loading...' : (isLoading ? 'Processing...' : mintButtonText)}
        </button>
        {transactionHash && (
          <p className="text-xs text-green-400 mt-2 truncate">Success! Tx: <a href={`https://sepolia.etherscan.io/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer" className="underline">{transactionHash}</a></p>
        )}
        {mintError && (
          <p className="text-xs text-red-400 mt-2">Error: {mintError}</p>
        )}
        
        {/* Gallery Toggle */}
        {details.totalSupply > 0 && (
          <button
            onClick={() => setShowGallery(!showGallery)}
            className="magic-button-secondary w-full mt-3 text-sm py-2"
          >
            {showGallery ? 'Hide Gallery' : `View NFTs (${Number(details.totalSupply)})`}
          </button>
        )}
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