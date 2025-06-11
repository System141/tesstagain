# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Jugiter" - a decentralized NFT launchpad application that allows users to create custom NFT collections on Ethereum Sepolia testnet. The application consists of:

- **Smart Contracts**: Factory pattern deploying ERC-721 collections with advanced features (allowlists, royalties, configurable parameters)
- **Frontend**: Next.js 15 application with Web3 integration via Ethers.js
- **IPFS Integration**: Pinata Cloud for metadata and image storage (NFT.Storage decommissioned June 2024)

## Development Commands

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server with Turbopack
npm run build        # Build production application
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Smart Contract Development
```bash
npx hardhat compile  # Compile contracts
npx hardhat test     # Run contract tests (if any exist)
npx hardhat run scripts/deploy.js --network sepolia  # Deploy to Sepolia
npx hardhat verify --network sepolia <contract-address>  # Verify on Etherscan
```

## Architecture

### Smart Contract Structure
- **NFTCollectionFactory**: Deploys new NFT collection instances
- **NFTCollection**: ERC-721 template with allowlist system, royalties (EIP-2981), and configurable minting parameters
- **Current Factory Address**: `0xe553934B8AD246a45785Ea080d53024aAbd39189` (Sepolia)

### Frontend Architecture
- **Main App**: `/frontend/app/page.tsx` - Primary interface for collection creation
- **Collections Browser**: `/frontend/app/components/NFTCollections.tsx` - Lists all deployed collections
- **Collection Cards**: `/frontend/app/components/NFTCollectionCard.tsx` - Individual collection interface with minting functionality
- **Image Upload**: `/frontend/app/components/ImageUploader.tsx` - IPFS upload via Pinata

### Key Features
- **Two-Phase Minting**: Allowlist phase with different pricing, then public minting
- **IPFS Integration**: Direct browser-to-IPFS upload for images and metadata
- **Wallet Integration**: MetaMask with automatic Sepolia network switching
- **Real-time Updates**: Live collection data and mint progress tracking

## Environment Variables Required

### Root `.env`:
```
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Frontend `.env.local`:
```
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
```

**Note**: NFT.Storage upload API was decommissioned on June 30, 2024. The project now uses Pinata Cloud for IPFS uploads.

## Development Notes

- **Target Network**: Ethereum Sepolia testnet only
- **Smart Contract Version**: Solidity 0.8.20 with optimizer enabled (200 runs)
- **Frontend Stack**: Next.js 15 + React 19 + TypeScript 5 + Tailwind CSS
- **Web3 Library**: Ethers.js 6.14.1 (not using RainbowKit/Wagmi despite README mention)
- **IPFS Gateway**: Uses multiple fallback gateways for reliability

## Testing

Currently no automated tests are configured. When adding tests:
- Smart contracts: Use Hardhat testing framework
- Frontend: Consider adding Jest/React Testing Library setup

## VPS Deployment

The application is ready for VPS deployment with Docker containerization.

### Quick Deployment Commands
```bash
# Automated deployment
./scripts/deploy.sh

# Manual deployment
docker compose up -d --build

# Health monitoring
./scripts/health-check.sh

# Backup management
./scripts/backup.sh --full
```

### Production Configuration
- **Docker**: Multi-stage builds with standalone Next.js output
- **Nginx**: Reverse proxy with SSL, compression, and security headers
- **Monitoring**: Automated health checks and service recovery
- **Backup**: Scheduled backups with retention policies
- **SSL**: Automatic Let's Encrypt certificate management

### Server Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **Network**: Public IP address, domain name (optional for SSL)

### Key Files for Deployment
- `docker-compose.yml` - Service orchestration
- `frontend/Dockerfile` - Application containerization
- `nginx/nginx.conf` - Reverse proxy configuration
- `scripts/deploy.sh` - Automated deployment script
- `scripts/health-check.sh` - Service monitoring
- `scripts/backup.sh` - Backup management
- `DEPLOYMENT.md` - Comprehensive deployment guide