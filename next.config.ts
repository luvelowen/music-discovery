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
          // Other websites get nothing. Our own forms still prove where they came from.
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
