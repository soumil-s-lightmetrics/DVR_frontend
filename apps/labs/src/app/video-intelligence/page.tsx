export const metadata = {
  title: "Video Intelligence",
  icons: { icon: "/video-intelligence.svg" },
};

// The Video Intelligence portal lives on a separate deployment
// (videorag.sdo.lightmetrics.co). We embed it full-screen here so it is reachable
// under the same origin (labs.lightmetrics.co/video-intelligence) like the other
// experiments, instead of navigating the user off to a different domain.
const PORTAL_URL = "https://videorag.sdo.lightmetrics.co/";

export default function Page() {
  return (
    <iframe
      src={PORTAL_URL}
      title="Video Intelligence"
      allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
