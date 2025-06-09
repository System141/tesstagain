import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  console.log('IPFS proxy request for URL:', url);

  if (!url) {
    console.error('No URL parameter provided');
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    console.log('Fetching from IPFS gateway:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Jugiter-NFT-Proxy/1.0'
      }
    });

    console.log('IPFS gateway response status:', response.status);
    console.log('IPFS gateway response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error(`IPFS gateway error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('Content type:', contentType);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Successfully parsed JSON data');
      return NextResponse.json(data);
    } else if (contentType.includes('image/')) {
      console.log('Response is an image, not metadata');
      return NextResponse.json({ 
        error: 'This is an image file, not JSON metadata',
        contentType,
        isImage: true,
        url
      }, { status: 400 });
    } else {
      const text = await response.text();
      console.log('Response is not JSON, got text:', text.substring(0, 200));
      
      // Try to parse as JSON anyway
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data);
      } catch (parseError) {
        console.error('Failed to parse as JSON:', parseError);
        return NextResponse.json({ 
          error: 'Response is not valid JSON',
          contentType,
          preview: text.substring(0, 200)
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('IPFS proxy error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch IPFS data',
      details: error instanceof Error ? error.message : String(error),
      url
    }, { status: 500 });
  }
} 