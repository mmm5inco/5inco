import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ibwvbkedilplcxoqpnlr.supabase.co',
      },
    ],
  },
};

export default nextConfig;
