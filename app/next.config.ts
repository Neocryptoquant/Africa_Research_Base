import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // experimental: {
  outputFileTracingRoot: './',
    outputFileTracingExcludes: {
      '*': [
        // Exclude heavy packages from serverless bundle
        'node_modules/lucide-react/**/*',
        'node_modules/@img/**/*',
        'node_modules/js-tiktoken/**/*',
        'node_modules/openai/**/*',
        'node_modules/@langchain/**/*',
        'node_modules/algosdk/**/*',
        'node_modules/recharts/**/*',
        'node_modules/@esbuild/**/*',
        'node_modules/lightningcss-linux-x64-musl/**/*',
        'node_modules/lightningcss-linux-x64-gnu/**/*',
        'node_modules/fetch-blob/**/*',
        // Build artifacts
        'node_modules/@next/**/*',
        'node_modules/@swc/**/*',
      ],
    },
  // } as any, // Type assertion to bypass strict typing
  // Use standalone output for better optimization
  output: 'standalone',
  
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
};

export default nextConfig;