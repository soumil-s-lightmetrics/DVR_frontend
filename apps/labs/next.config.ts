import type { NextConfig } from "next";

// The DVR flow's Flask backend (main-DVR.py) serves its REST + WebSocket API on
// :8000. Proxy the HTTP paths through Next rewrites so the /dvr-request-flow app
// can keep using same-origin paths. The /chat WebSocket can't be proxied by
// rewrites — the client connects to it directly via NEXT_PUBLIC_WS_URL.
const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@lmlabs/ui"],
  // Deployed on Amplify Web Compute (SSR). `standalone` traces every runtime
  // dependency (including `next`) into .next/standalone, which makes the SSR
  // deploy work in this pnpm monorepo where node_modules is symlinked.
  output: "standalone",
  async rewrites() {
    return [
      { source: "/:fleet/load-data", destination: `${BACKEND}/:fleet/load-data` },
      { source: "/health", destination: `${BACKEND}/health` },
      { source: "/static/:path*", destination: `${BACKEND}/static/:path*` },
    ];
  },
};

export default nextConfig;
