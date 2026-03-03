import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfjs-dist'],
  // For standard next build (Webpack)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  // For Turbopack (Next.js 15 builders)
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: './empty-module.js',
      },
    },
  },
};

export default nextConfig;
