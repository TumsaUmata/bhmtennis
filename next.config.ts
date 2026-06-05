import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/mens-singles", destination: "/tournament/2026-summer/mens-singles", permanent: false },
      { source: "/womens-singles", destination: "/tournament/2026-summer/womens-singles", permanent: false },
      { source: "/mixed-doubles", destination: "/tournament/2026-summer/mixed-doubles", permanent: false },
      { source: "/rules", destination: "/tournament/2026-summer/rules", permanent: false },
    ];
  },
};

export default nextConfig;
