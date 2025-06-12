import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import NFTImage from './NFTImage';
// Removed unused imports

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
  // Gallery removed

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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-900/20 group">
      {/* Collection Image */}
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        <NFTImage
          tokenUri={details.baseURI}
          alt={`${details.name} collection`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          width={300}
          height={300}
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          {details.totalSupply >= details.maxSupply ? (
            <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-red-400/30">
              Sold Out
            </span>
          ) : isAllowlistTimeActive ? (
            <span className="px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-blue-400/30">
              Allowlist
            </span>
          ) : (
            <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-green-400/30">
              Live
            </span>
          )}
        </div>

        {/* Quick Actions - Appears on Hover */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
          <button className="w-8 h-8 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collection Info */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors duration-300 truncate" title={details.name}>
            {details.name}
          </h3>
          <p className="text-sm text-zinc-400 flex items-center gap-2">
            {details.symbol}
            {/* Verified Badge */}
            <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          </p>
        </div>

        {/* Enhanced Key Stats */}
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Mint Price</div>
              <div className="text-lg font-bold text-white flex items-center gap-1">
                {formatEther(details.allowlistActive && details.allowlistEndTime > BigInt(Math.floor(Date.now() / 1000)) ? details.allowlistMintPrice : details.publicMintPrice)} 
                <span className="text-sm text-zinc-400">ETH</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Available</div>
              <div className="text-lg font-bold text-white">
                {Number(details.maxSupply) - Number(details.totalSupply)}
              </div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{Number(details.totalSupply)} minted</span>
              <span>{Number(details.maxSupply)} total</span>
            </div>
            <div className="bg-zinc-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${mintProgress.toFixed(2)}%` }}
              ></div>
            </div>
            <div className="text-xs text-center text-zinc-500">
              {mintProgress.toFixed(1)}% sold
            </div>
          </div>
        </div>

        {/* Mint Controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input 
              type="number" 
              value={quantity}
              min="1"
              max={maxQuantityForInput > 0 ? maxQuantityForInput : 1}
              onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value), maxQuantityForInput > 0 ? maxQuantityForInput : 1)) )}
              disabled={isButtonDisabled || details.totalSupply >= details.maxSupply}
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded px-3 py-2 text-center disabled:opacity-50"
            />
            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-center">
              <span className="text-white text-sm">
                {formatEther((isAllowlistStageOverallActive ? details.allowlistMintPrice : details.publicMintPrice) * BigInt(quantity))} ETH
              </span>
            </div>
          </div>

          <button 
            onClick={handleMint}
            disabled={isButtonDisabled || isLoading}
            className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && !details ? 'Loading...' : 
             isLoading ? 'Processing...' : 
             mintButtonText}
          </button>

          {transactionHash && (
            <div className="text-xs text-green-400 text-center">
              ✅ Success! <a href={`https://sepolia.etherscan.io/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer" className="underline">View</a>
            </div>
          )}
          
          {mintError && (
            <div className="text-xs text-red-400 text-center">
              ❌ {mintError}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
} 