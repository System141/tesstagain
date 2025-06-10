import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Extract IPFS hash for alternative gateways
  const ipfsHash = extractIpfsHash(imageUrl);
  const urlsToTry = ipfsHash ? [imageUrl, ...ALTERNATIVE_GATEWAYS.map(gateway => `${gateway}${ipfsHash}`)] : [imageUrl];

  for (let i = 0; i < urlsToTry.length; i++) {
    const currentUrl = urlsToTry[i];
    
    try {
      console.log(`Fetching image (attempt ${i + 1}):`, currentUrl);
      
      // Fetch the image from IPFS
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Jugiter-Image-Proxy/1.0',
          'Accept': 'image/*'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        // If rate limited (429), try next gateway immediately
        if (response.status === 429) {
          console.log('Rate limited, trying next gateway...');
          continue;
        }
        
        console.error(`Image fetch error: ${response.status} ${response.statusText}`);
        
        // Only try a few alternatives for other errors
        if (i >= 2) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        continue;
      }

      // Get the image data
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      console.log(`Successfully fetched image via gateway ${i + 1}:`, currentUrl);

      // Return the image with proper headers
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error(`Image proxy error (attempt ${i + 1}):`, error);
      
      // If not the last attempt, try next gateway
      if (i < urlsToTry.length - 1) {
        continue;
      }
      
      return NextResponse.json({ error: 'Failed to fetch image from all gateways' }, { status: 500 });
    }
  }
}