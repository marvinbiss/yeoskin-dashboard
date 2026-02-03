/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },

  // Images configuration - optimized
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Optimize image quality
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize memory usage
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@supabase/supabase-js',
    ],
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Path alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Production optimizations
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // Vendor chunk for stable dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate chunk for Supabase
          supabase: {
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 20,
          },
          // Separate chunk for charts library
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 20,
          },
          // Separate chunk for animation library
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            name: 'animations',
            chunks: 'all',
            priority: 20,
          },
          // Common components chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // HTTP Headers for caching and security
  async headers() {
    return [
      {
        // Static assets - long cache
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // JS/CSS files - cache with revalidation
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes - no cache
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects for backward compatibility
  async redirects() {
    return [];
  },

  // Rewrites for API proxying if needed
  async rewrites() {
    return [];
  },

  // Modular imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Output configuration
  output: 'standalone',

  // Powered by header disabled for security
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // Generate ETags for caching
  generateEtags: true,
};

module.exports = nextConfig;
