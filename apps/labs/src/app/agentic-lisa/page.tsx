// Agentic LISA is embedded (iframed) under this app rather than linking out,
// like the Video Intelligence portal. The URL includes an access token, so it
// lives in an env var instead of being hardcoded — see .env.local.example.
const CHATBOT_URL = process.env.NEXT_PUBLIC_AGENTIC_LISA_CHATBOT_URL;

export default function Page() {
  return (
    <iframe
      src={CHATBOT_URL}
      title="Agentic LISA"
      allow="clipboard-read; clipboard-write; fullscreen"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
