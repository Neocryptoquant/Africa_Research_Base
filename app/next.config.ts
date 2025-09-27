import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Minimize bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude client-only packages from server bundle
      config.externals.push({
        'lucide-react': 'lucide-react',
        'recharts': 'recharts',
      });
    }
    return config;
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