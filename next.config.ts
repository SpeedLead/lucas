import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this folder. Without it, Turbopack walks up and
    // finds an unrelated package-lock.json in ~/Desktop/workspace and warns.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
