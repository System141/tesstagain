'use client';

import { useState } from 'react';

export default function EmergencyDebug() {
  const [showDebug, setShowDebug] = useState(false);

  const checkWallet = async () => {
    console.log('=== EMERGENCY DEBUG ===');
    console.log('window.ethereum:', !!window.ethereum);
    
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('Connected accounts:', accounts);
        
        if (accounts.length > 0) {
          const { BrowserProvider } = await import('ethers');
          const provider = new BrowserProvider(window.ethereum);
          console.log('Provider created');
          
          const network = await provider.getNetwork();
          console.log('Network:', network.chainId, network.name);
          
          const blockNumber = await provider.getBlockNumber();
          console.log('Current block:', blockNumber);
        }
      } catch (error) {
        console.error('Debug error:', error);
      }
    }
    console.log('=== END DEBUG ===');
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded text-xs opacity-50 hover:opacity-100"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded border border-red-500 text-xs max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-red-400">Emergency Debug</span>
        <button onClick={() => setShowDebug(false)} className="text-red-400">×</button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={checkWallet}
          className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
        >
          Check Wallet Connection
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          Force Reload
        </button>
        
        <div className="text-xs text-zinc-400 mt-2">
          Check browser console for logs
        </div>
      </div>
    </div>
  );
}