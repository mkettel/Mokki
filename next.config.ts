import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow large uploads: 20 files * 100MB max = 2GB theoretical max
      // Setting to 500MB for practical bulk uploads
      bodySizeLimit: "500mb",
    },
    // Also needed for middleware/proxy to handle large requests
    middlewareClientMaxBodySize: "500mb",
  },
};

export default nextConfig;
