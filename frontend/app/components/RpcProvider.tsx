'use client';

import { BrowserProvider, JsonRpcProvider } from 'ethers';

// Multiple Sepolia RPC endpoints for fallback
const SEPOLIA_RPC_URLS = [
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
  'https://ethereum-sepolia.publicnode.com',
  'https://rpc2.sepolia.org',
  'https://sepolia.gateway.tenderly.co'
];

export class RobustProvider {
  private static instance: RobustProvider;
  private provider: BrowserProvider | JsonRpcProvider | null = null;
  private fallbackProviders: JsonRpcProvider[] = [];

  constructor() {
    this.initializeFallbackProviders();
  }

  static getInstance(): RobustProvider {
    if (!RobustProvider.instance) {
      RobustProvider.instance = new RobustProvider();
    }
    return RobustProvider.instance;
  }

  private initializeFallbackProviders() {
    this.fallbackProviders = SEPOLIA_RPC_URLS.map(url => new JsonRpcProvider(url));
  }

  async getProvider(): Promise<BrowserProvider | JsonRpcProvider> {
    if (this.provider) {
      return this.provider;
    }

    // Try MetaMask first
    if (window.ethereum) {
      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        // Quick test
        await Promise.race([
          browserProvider.getBlockNumber(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        this.provider = browserProvider;
        console.log('Using MetaMask provider');
        return browserProvider;
      } catch (error) {
        console.warn('MetaMask provider failed, trying fallbacks:', error);
      }
    }

    // Try fallback RPC providers
    for (let i = 0; i < this.fallbackProviders.length; i++) {
      try {
        const provider = this.fallbackProviders[i];
        await Promise.race([
          provider.getBlockNumber(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
        this.provider = provider;
        console.log(`Using fallback RPC provider: ${SEPOLIA_RPC_URLS[i]}`);
        return provider;
      } catch (error) {
        console.warn(`Fallback RPC ${SEPOLIA_RPC_URLS[i]} failed:`, error);
      }
    }

    throw new Error('All RPC providers failed');
  }

  async getBlockNumber(): Promise<number> {
    try {
      const provider = await this.getProvider();
      return await Promise.race([
        provider.getBlockNumber(),
        new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Block number timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Failed to get block number:', error);
      // Return a reasonable fallback block number for Sepolia
      return 5000000;
    }
  }

  async queryFilter(contract: any, filter: any, fromBlock: number): Promise<any[]> {
    try {
      return await Promise.race([
        contract.queryFilter(filter, fromBlock),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 8000))
      ]);
    } catch (error) {
      console.error('Failed to query events:', error);
      return []; // Return empty array as fallback
    }
  }

  resetProvider() {
    this.provider = null;
  }
}