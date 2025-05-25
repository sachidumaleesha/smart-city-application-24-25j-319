import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",  // Let nginx handle the proxy
      },
      {
        source: "/cctv/:path*",
        destination: "/cctv/:path*",  // Let nginx handle the proxy
      }
    ];
  },
  // Add output configuration
  output: 'standalone',
};

export default nextConfig;
