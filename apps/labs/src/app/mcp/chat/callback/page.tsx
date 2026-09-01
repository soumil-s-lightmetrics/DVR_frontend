"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeLoginCallback } from "../mcpChatAuth";
import styles from "../chat.module.css";

// Cognito's hosted UI redirects here with `?code=` after login; this page's
// only job is to complete the PKCE token exchange, then hand off to the
// chat UI proper. See mcpChatAuth.ts / mcp-trial/README.md.
export default function McpChatCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeLoginCallback()
      .then(() => router.replace("/mcp/chat"))
      .catch(() => setError("Sign-in failed. Please try again."));
  }, [router]);

  return (
    <div className={styles.callbackPage}>
      {error ?? "Signing in…"}
    </div>
  );
}
