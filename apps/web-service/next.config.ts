import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@resume-hub/shared', '@resume-hub/ui'],
};

export default nextConfig;
