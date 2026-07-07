import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lmlabs/ui"],
  // labs has no server code (all routes are static), so export a fully static
  // site to ./out. This deploys on Amplify's static "Web" platform and avoids
  // the SSR runtime entirely.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
