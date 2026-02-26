import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore native modules from webpack bundling
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
