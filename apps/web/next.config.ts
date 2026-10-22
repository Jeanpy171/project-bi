import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bi/contracts', '@bi/kernel', '@bi/query-ir'],
};

export default nextConfig;
