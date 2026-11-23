import type { NextConfig } from 'next';

const dev = process.env.NODE_ENV === 'development';
// Once the app has a public address, every request must use https.
const isPublic = Boolean(process.env.APP_HOSTS);

// Anything named NEXT_PUBLIC_ is copied into the pages everyone downloads. A secret must never be one of them.
const leaked = Object.keys(process.env).filter((name) => name.startsWith('NEXT_PUBLIC_') && /PASS|SECRET|KEY|TOKEN|SMTP/i.test(name));
if (leaked.length) throw new Error(`Rename ${leaked.join(', ')}: secrets must not start with NEXT_PUBLIC_, or every visitor can read them.`);

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
  "worker-src 'self'",
  "manifest-src 'self'",
  ...(isPublic ? ['upgrade-insecure-requests'] : []),
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
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), browsing-topics=()' },
          // Other websites get nothing. Our own forms still prove where they came from.
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: CONTENT_POLICY },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Other websites can't embed or read this app's files, photos included.
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          // Browsers ignore this on plain http, so it only takes effect on a real address.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
