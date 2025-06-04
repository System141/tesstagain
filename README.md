# NFT Collection Factory

This is a decentralized application (dApp) that allows users to create their own NFT collections on the Sepolia testnet. The application consists of a smart contract factory that deploys new NFT collections and a user-friendly frontend interface.

## Smart Contracts

The smart contracts are deployed on the Sepolia testnet:
- Factory Contract Address: `0x091659d7D9137e2e172E9B155AfA6fC76c93712d`
- Verified on Etherscan: [View Contract](https://sepolia.etherscan.io/address/0x091659d7D9137e2e172E9B155AfA6fC76c93712d#code)

## Features

- Create custom NFT collections with configurable parameters:
  - Collection Name
  - Symbol
  - Base URI for NFT metadata
  - Maximum Supply
  - Mint Price
  - Maximum tokens per wallet
- Automatic contract deployment and verification
- User-friendly interface with Web3 wallet integration
- Support for public minting

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A Web3 wallet (e.g., MetaMask)
- Sepolia testnet ETH

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nft-collection-factory
```

2. Install dependencies:
```bash
# Install smart contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. Create a `.env` file in the root directory with your credentials:
```
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

4. Start the frontend development server:
```bash
cd frontend
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Connect your Web3 wallet (make sure you're on Sepolia testnet)
2. Fill in the collection details:
   - Collection Name: The name of your NFT collection
   - Symbol: A short identifier for your collection (e.g., "BAYC")
   - Base URI: The IPFS or HTTP URI where your NFT metadata is hosted
   - Max Supply: The maximum number of NFTs that can be minted
   - Mint Price: The price to mint each NFT in ETH
   - Max Per Wallet: Maximum number of NFTs that can be minted per wallet
3. Click "Create Collection" and confirm the transaction in your wallet
4. Wait for the transaction to be confirmed
5. Your new NFT collection will be deployed and automatically verified on Etherscan

## Development

### Smart Contracts

- The contracts are written in Solidity 0.8.20
- Uses OpenZeppelin contracts for standard implementations
- Hardhat for development and deployment

To compile contracts:
```bash
npx hardhat compile
```

To deploy to Sepolia:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Frontend

- Built with Next.js 13+
- Uses RainbowKit for wallet connection
- Wagmi for contract interactions
- Tailwind CSS for styling

## License

MIT
