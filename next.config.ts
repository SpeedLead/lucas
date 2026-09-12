import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for `use cache` (src/lib/market-server.ts). unstable_cache, the old
  // way to cache a non-fetch call, is deprecated in favour of this in Next 16.
  cacheComponents: true,

  turbopack: {
    // Pin the workspace root to this folder. Without it, Turbopack walks up and
    // finds an unrelated package-lock.json in ~/Desktop/workspace and warns.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
