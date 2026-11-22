import type { NextConfig } from 'next';

const dev = process.env.NODE_ENV === 'development';

// Scripts, pictures and connections come from this app only. Next.js needs inline scripts, and eval only in development.
const CONTENT_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

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
          { key: 'Content-Security-Policy', value: CONTENT_POLICY },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          // Browsers ignore this on plain http, so it only takes effect on a real address.
          { key: 'Strict-Transport-Security', value: 'max-age=15552000' },
        ],
      },
    ];
  },
};

export default nextConfig;
