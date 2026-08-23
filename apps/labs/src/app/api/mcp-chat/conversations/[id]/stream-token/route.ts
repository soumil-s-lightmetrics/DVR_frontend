import { NextRequest, NextResponse } from "next/server";

// Server-side only - mints a short-lived token the browser then uses to call
// the Lambda Function URL directly for POST .../messages, bypassing Amplify
// Hosting's fixed 30s SSR response timeout (too short for slow tool-calling
// chat turns). This route itself stays behind session auth (middleware.ts)
// and the static PROXY_AUTH_KEY, so only a logged-in user can obtain a token.
const BACKEND_URL = process.env.MCP_CHAT_BACKEND_URL;
const AUTH_KEY = process.env.MCP_CHAT_AUTH_KEY ?? "";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "MCP_CHAT_BACKEND_URL is not configured on the server." },
      { status: 500 },
    );
  }
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/conversations/${id}/stream-token`, {
    method: "POST",
    headers: { "x-mcp-chat-key": AUTH_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
