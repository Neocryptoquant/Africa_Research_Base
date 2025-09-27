import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Minimize bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  eslint: {
    dirs: ['app', 'lib', 'scripts'],
    ignoreDuringBuilds: true
  },
  
  // Configure images
  images: {
    domains: ['localhost'], // Allow localhost for development
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;