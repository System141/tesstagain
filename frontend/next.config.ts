import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for production deployment
  output: 'standalone',
  
  // Compress images for better performance
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: [
      'gateway.pinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'dweb.link'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.dweb.link',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.cf-ipfs.com',
      }
    ],
  },
  
  // SWC minification is now default in Next.js 15
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['ethers'],
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
