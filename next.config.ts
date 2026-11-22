import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // The browser itself refuses any attempt by this app to read location, camera or microphone.
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
