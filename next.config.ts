layouimport type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'canvas'],
  turbopack: {
    resolveAlias: {
      canvas: { browser: './empty-module.js', default: './empty-module.js' },
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
