// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { 
    domains: ['i.postimg.cc'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  
  // Suppresses source map uploading logs during build
  silent: true,
  
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
  
  // Automatically annotate React components to show component data in Sentry
  reactComponentAnnotation: {
    enabled: true,
  },
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
