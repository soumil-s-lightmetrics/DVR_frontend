// Where the Flask backend (main-DVR.py) lives. This file is the one place both
// addresses are decided:
//   npm run dev    -> Flask on localhost:8080
//   npm run build  -> the Railway deployment
// BACKEND_URL / NEXT_PUBLIC_WS_URL override either, e.g. to point a build at a
// Railway preview environment. Both are resolved at build time, so a deployed
// build keeps talking to whatever it was built against.
const RAILWAY_HOST = "dvrrequest-flow-production.up.railway.app";
const isProd = process.env.NODE_ENV === "production";

const BACKEND = process.env.BACKEND_URL || (isProd ? `https://${RAILWAY_HOST}` : "http://localhost:8080");

// Next rewrites can't proxy WebSockets, so the browser connects to /chat
// directly. Passed to the client as DVR_WS_URL (read in useWebSocket.js).
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (isProd ? `wss://${RAILWAY_HOST}/chat` : "ws://localhost:8080/chat");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DVR_WS_URL: WS_URL,
  },
  // HTTP calls stay same-origin in the browser and are proxied to the backend.
  async rewrites() {
    return [
      { source: "/:fleet/load-data", destination: `${BACKEND}/:fleet/load-data` },
      { source: "/health", destination: `${BACKEND}/health` },
      { source: "/static/:path*", destination: `${BACKEND}/static/:path*` },
    ];
  },
};

export default nextConfig;
