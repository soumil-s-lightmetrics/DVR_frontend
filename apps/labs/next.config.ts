import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lmlabs/ui"],
  // Deployed on Amplify Web Compute (SSR). `standalone` traces every runtime
  // dependency (including `next`) into .next/standalone, which makes the SSR
  // deploy work in this pnpm monorepo where node_modules is symlinked.
  output: "standalone",
};

export default nextConfig;
