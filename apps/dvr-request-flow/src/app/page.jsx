"use client";

import dynamic from "next/dynamic";

// Render the SPA client-only. The app relies on browser APIs (WebSocket,
// location, Date.now) and holds all state on the client, so there's nothing to
// server-render — ssr:false avoids hydration mismatches and mirrors how the
// original Vite build behaved.
const App = dynamic(() => import("../App.jsx"), { ssr: false });

export default function Page() {
  return <App />;
}
