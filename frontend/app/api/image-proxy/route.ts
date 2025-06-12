import { NextRequest, NextResponse } from 'next/server';

// Multiple IPFS gateways for retry logic (updated with better performing gateways)
const ALTERNATIVE_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://4everland.io/ipfs/'
];

function extractIpfsHash(url: string): string | null {
  const match = url.match(/\/ipfs\/([^/?]+)/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    console.log('Image proxy request for URL:', imageUrl);

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
      
      // Fetch the image from IPFS with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Jugiter-Image-Proxy/1.0',
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // If rate limited (429), try next gateway immediately
        if (response.status === 429) {
          console.log('Rate limited, trying next gateway...');
          continue;
        }
        
        console.error(`Image fetch error: ${response.status} ${response.statusText}`);
        
        // Try all gateways before giving up
        if (i >= urlsToTry.length - 1) {
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
      
      // Return a 1x1 transparent pixel as fallback
      const transparentPixel = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      console.log('All gateways failed, returning transparent placeholder');
      return new NextResponse(transparentPixel, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  } catch (globalError) {
    console.error('Global image proxy error:', globalError);
    // Return a transparent pixel as fallback for global errors too
    const transparentPixel = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    return new NextResponse(transparentPixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}