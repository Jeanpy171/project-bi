import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bi/contracts', '@bi/kernel', '@bi/query-ir'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/dashboards',
        destination: '/?view=dashboards',
      },
      {
        source: '/browse',
        destination: '/?view=browse',
      },
      {
        source: '/builder',
        destination: '/?view=builder',
      },
      {
        source: '/connections',
        destination: '/?view=connections',
      },
    ];
  },
};

export default nextConfig;
