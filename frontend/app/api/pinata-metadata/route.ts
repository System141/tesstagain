import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json();

    // Validate metadata structure
    if (!metadata.name || !metadata.image) {
      return NextResponse.json({ error: 'Missing required metadata fields (name, image)' }, { status: 400 });
    }

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      return NextResponse.json({ error: 'Pinata API credentials not configured' }, { status: 500 });
    }

    // Prepare metadata for Pinata
    const pinataMetadata = {
      name: `${metadata.name}-metadata.json`,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        nftName: metadata.name,
        type: 'nft-metadata'
      }
    };

    const pinataBody = {
      pinataContent: metadata,
      pinataMetadata: pinataMetadata
    };

    // Upload metadata to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: JSON.stringify(pinataBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Pinata metadata upload error:', errorData);
      return NextResponse.json({ 
        error: `Pinata metadata upload failed: ${response.statusText}`,
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      IpfsHash: data.IpfsHash,
      PinSize: data.PinSize,
      Timestamp: data.Timestamp,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    });

  } catch (error) {
    console.error('Error in Pinata metadata upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}