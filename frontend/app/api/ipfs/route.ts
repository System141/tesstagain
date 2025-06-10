import { NextResponse } from 'next/server';

// Multiple IPFS gateways for retry logic
const ALTERNATIVE_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cf-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://ipfs.filebase.io/ipfs/',
  'https://4everland.io/ipfs/'
];

function extractIpfsHash(url: string): string | null {
  const match = url.match(/\/ipfs\/([^/?]+)/);
  return match ? match[1] : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  console.log('IPFS proxy request for URL:', url);

  if (!url) {
    console.error('No URL parameter provided');
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Extract IPFS hash for alternative gateways and store original tokenURI
  const ipfsHash = extractIpfsHash(url);
  const urlsToTry = ipfsHash ? [url, ...ALTERNATIVE_GATEWAYS.map(gateway => `${gateway}${ipfsHash}`)] : [url];
  const originalTokenUri = ipfsHash ? `ipfs://${ipfsHash}` : url;

  for (let i = 0; i < urlsToTry.length; i++) {
    const currentUrl = urlsToTry[i];
    
    try {
      console.log(`Fetching from IPFS gateway (attempt ${i + 1}):`, currentUrl);
      
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Jugiter-NFT-Proxy/1.0',
          'Accept': 'application/json, image/*, */*'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      });

      console.log('IPFS gateway response status:', response.status);

      if (!response.ok) {
        // If rate limited (429), try next gateway immediately
        if (response.status === 429) {
          console.log('Rate limited, trying next gateway...');
          continue;
        }
        
        console.error(`IPFS gateway error: ${response.status} ${response.statusText}`);
        
        // Only try a few alternatives for other errors
        if (i >= 2) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      console.log('Content type:', contentType);

      if (contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Successfully parsed JSON data');
        return NextResponse.json(data);
      } else if (contentType.includes('image/')) {
        console.log('Response is an image, treating as direct tokenURI');
        
        // For direct image tokenURIs, return a synthetic metadata object
        const syntheticMetadata = {
          name: "NFT",
          description: "NFT with direct image tokenURI",
          image: originalTokenUri,
          external_url: "",
          attributes: []
        };
        
        console.log('Created synthetic metadata for direct image:', syntheticMetadata);
        return NextResponse.json(syntheticMetadata);
      } else {
        const text = await response.text();
        console.log('Response is not JSON, got text:', text.substring(0, 200));
        
        // Try to parse as JSON anyway
        try {
          const data = JSON.parse(text);
          return NextResponse.json(data);
        } catch (parseError) {
          console.error('Failed to parse as JSON:', parseError);
          
          // Check if this looks like binary data (image)
          if (text.startsWith('\u0089PNG') || text.startsWith('\u00ff\u00d8\u00ff') || text.includes('JFIF')) {
            console.log('Detected binary image data, creating synthetic metadata');
            const syntheticMetadata = {
              name: "NFT",
              description: "NFT with direct image tokenURI",
              image: originalTokenUri,
              external_url: "",
              attributes: []
            };
            return NextResponse.json(syntheticMetadata);
          }
          
          // If not the last attempt, try next gateway
          if (i < urlsToTry.length - 1) {
            continue;
          }
          return NextResponse.json({ 
            error: 'Response is not valid JSON',
            contentType,
            preview: text.substring(0, 200)
          }, { status: 500 });
        }
      }
    } catch (error) {
      console.error(`IPFS proxy error (attempt ${i + 1}):`, error);
      
      // If not the last attempt, try next gateway
      if (i < urlsToTry.length - 1) {
        continue;
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch IPFS data from all gateways',
        details: error instanceof Error ? error.message : String(error),
        url
      }, { status: 500 });
    }
  }
} 