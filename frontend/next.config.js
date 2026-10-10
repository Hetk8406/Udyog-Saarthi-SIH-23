const apiUrl = process.env.NEXT_PUBLIC_API_URL;
let apiOrigin = '';
if (apiUrl) {
  try {
    apiOrigin = new URL(apiUrl).origin;
  } catch {
    apiOrigin = apiUrl;
  }
}
const devConnectOrigins = process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:8000 http://localhost:8000' : '';
const connectSources = [
  "'self'",
  apiOrigin,
  devConnectOrigins,
  'https://challenges.cloudflare.com',
  'https://plausible.io',
  'https:',
].filter(Boolean).join(' ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false, // Disables 'X-Powered-By: Next.js' technology fingerprinting
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://plausible.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "frame-src 'self' https://challenges.cloudflare.com",
              `connect-src ${connectSources}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
});
