import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for production deployment
  output: 'standalone',
  
  // Compress images for better performance
  images: {
    formats: ['image/webp', 'image/avif'],
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
