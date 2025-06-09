import { useState } from 'react';

interface TestResult {
  url: string;
  success: boolean;
  status: number;
  responseTime: number;
  error: string | null;
}

export default function NetworkTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const testUrls = [
    'https://gateway.pinata.cloud/ipfs/QmPAg1mjxcEQPPtqsLoEcauVedaeMH81WXDPvPx3VC5zUz',
    'https://ipfs.io/ipfs/QmPAg1mjxcEQPPtqsLoEcauVedaeMH81WXDPvPx3VC5zUz',
    'https://cloudflare-ipfs.com/ipfs/QmPAg1mjxcEQPPtqsLoEcauVedaeMH81WXDPvPx3VC5zUz',
    'https://dweb.link/ipfs/QmPAg1mjxcEQPPtqsLoEcauVedaeMH81WXDPvPx3VC5zUz'
  ];

  const testConnectivity = async () => {
    setTesting(true);
    setResults([]);
    
    const testResults = [];
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        testResults.push({
          url,
          success: response.ok,
          status: response.status,
          responseTime,
          error: null
        });
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        testResults.push({
          url,
          success: false,
          status: 0,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      setResults([...testResults]);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setTesting(false);
  };

  return (
    <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Network Test</h3>
        <button 
          onClick={testConnectivity}
          disabled={testing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test IPFS'}
        </button>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {results.map((result, i) => (
          <div key={i} className="text-xs p-2 bg-gray-700 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                Gateway {i + 1}
              </span>
              <span className="text-gray-400">{result.responseTime}ms</span>
            </div>
            <div className="text-gray-300 truncate" title={result.url}>
              {result.url.replace('https://', '').split('/')[0]}
            </div>
            {result.error && (
              <div className="text-red-300 mt-1">{result.error}</div>
            )}
            {result.success && (
              <div className="text-green-300">✓ HTTP {result.status}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}