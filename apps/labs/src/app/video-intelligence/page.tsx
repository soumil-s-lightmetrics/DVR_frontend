export const metadata = {
  title: "Video Intelligence",
  icons: { icon: "/video-intelligence.svg" },
};

// Read the shared secret at request time (not baked in at build) so it can be
// set purely as a runtime env var on the server.
export const dynamic = "force-dynamic";

// The Video Intelligence portal (videorag) lives on a separate deployment and
// normally shows its own password gate. We embed it full-screen here and pass a
// shared secret token in the URL; videorag skips its password gate only when the
// token matches (see its app.py `_is_embedded_by_labs`). The token comes from a
// server-only env var, so it is NOT inlined into the client JS bundle.
//
// SECURITY: the token still appears in this page's server-rendered HTML (as the
// iframe src) and in videorag's own URL, so anyone who can view the labs page
// source can read it. This gates *direct* access to videorag (you must know the
// token) but it is not a true secret. For real protection, upgrade to a
// short-lived HMAC-signed token (see the note I left in chat).
const PORTAL_URL = "https://videorag.sdo.lightmetrics.co/";

export default function Page() {
  const token = process.env.VIDEORAG_EMBED_TOKEN ?? "";
  const src = token
    ? `${PORTAL_URL}?embed_token=${encodeURIComponent(token)}`
    : PORTAL_URL;

  return (
    <iframe
      src={src}
      title="Video Intelligence"
      allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
