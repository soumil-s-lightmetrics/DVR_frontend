// The Flask backend (main-DVR.py) serves the REST + WebSocket API on :8000.
// In dev, Next proxies the HTTP API calls through rewrites so the frontend can
// keep using same-origin paths, exactly like the original single-file page.
// The /chat WebSocket can't be proxied by Next rewrites — the client connects
// to it directly via NEXT_PUBLIC_WS_URL (see .env.local), falling back to a
// same-origin ws:// URL in prod (where Flask serves the built app).
const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deployed on Amplify Web Compute (SSR). `standalone` traces every runtime
  // dependency into .next/standalone so the SSR deploy works in this pnpm
  // monorepo where node_modules is symlinked.
  output: "standalone",
  async rewrites() {
    return [
      { source: "/:fleet/load-data", destination: `${BACKEND}/:fleet/load-data` },
      { source: "/health", destination: `${BACKEND}/health` },
      { source: "/images/:path*", destination: `${BACKEND}/images/:path*` },
      { source: "/static/:path*", destination: `${BACKEND}/static/:path*` },
    ];
  },
};

export default nextConfig;
