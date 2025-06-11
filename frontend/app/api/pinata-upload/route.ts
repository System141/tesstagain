import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max size: 10MB' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, GIF, SVG, WebP' }, { status: 400 });
    }

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      return NextResponse.json({ error: 'Pinata API credentials not configured' }, { status: 500 });
    }

    // Create FormData for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    // Optional: Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString()
      }
    });
    pinataFormData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Pinata upload error:', errorData);
      return NextResponse.json({ 
        error: `Pinata upload failed: ${response.statusText}`,
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      IpfsHash: data.IpfsHash,
      PinSize: data.PinSize,
      Timestamp: data.Timestamp,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    });

  } catch (error) {
    console.error('Error in Pinata upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}