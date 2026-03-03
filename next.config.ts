import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore native modules from webpack bundling
  serverExternalPackages: ['pdf-parse', 'canvas'],
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
