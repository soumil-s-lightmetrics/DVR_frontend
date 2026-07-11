"use client";

import { useRef } from "react";

// The Video Intelligence portal lives on a separate deployment
// (videorag.sdo.lightmetrics.co). We embed it full-screen here so it is reachable
// under the same origin (labs.lightmetrics.co/video-intelligence) like the other
// experiments, instead of navigating the user off to a different domain.
const PORTAL_URL = "https://videorag.sdo.lightmetrics.co/";
// postMessage's targetOrigin must be the exact origin (no path) — using "*"
// would let the password leak to whatever the iframe happens to be showing
// if it ever navigates elsewhere.
const PORTAL_ORIGIN = "https://videorag.sdo.lightmetrics.co";

export default function Page() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <iframe
      ref={iframeRef}
      src={PORTAL_URL}
      title="Video Intelligence"
      allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
      onLoad={() => {
        // Skips videorag's own separate password prompt so users don't have
        // to log in twice. videorag listens for this message and auto-fills
        // + submits its login form; see its own code for the receiving side.
        // NEXT_PUBLIC_* is inlined into the client bundle at build time, so
        // this password is visible to anyone who inspects this page — it's
        // not actually secret once set.
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "videorag-auto-login",
            password: process.env.NEXT_PUBLIC_VIDEORAG_SHARED_PASSWORD,
          },
          PORTAL_ORIGIN
        );
      }}
    />
  );
}
