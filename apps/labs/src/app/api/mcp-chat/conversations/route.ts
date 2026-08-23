import { NextResponse } from "next/server";

// Server-side only - keeps the Lambda Function URL and its shared-secret key
// out of the browser bundle. See MCP_CHAT_BACKEND_URL/MCP_CHAT_AUTH_KEY in
// .env.local.example and mcp-trial/backend/README.md for the deploy side.
const BACKEND_URL = process.env.MCP_CHAT_BACKEND_URL;
const AUTH_KEY = process.env.MCP_CHAT_AUTH_KEY ?? "";

function missingBackendResponse() {
  return NextResponse.json(
    { error: "MCP_CHAT_BACKEND_URL is not configured on the server." },
    { status: 500 },
  );
}

export async function POST() {
  if (!BACKEND_URL) return missingBackendResponse();

  const res = await fetch(`${BACKEND_URL}/conversations`, {
    method: "POST",
    headers: { "x-mcp-chat-key": AUTH_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET() {
  if (!BACKEND_URL) return missingBackendResponse();

  const res = await fetch(`${BACKEND_URL}/conversations`, {
    headers: { "x-mcp-chat-key": AUTH_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
