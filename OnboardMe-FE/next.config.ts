import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
      serverActions: {
        bodySizeLimit: "128mb", // subír el número si se necesita más
      },
  },
};

export default nextConfig;
