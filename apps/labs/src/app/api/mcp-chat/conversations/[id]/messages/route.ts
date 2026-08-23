import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.MCP_CHAT_BACKEND_URL;
const AUTH_KEY = process.env.MCP_CHAT_AUTH_KEY ?? "";

function missingBackendResponse() {
  return NextResponse.json(
    { error: "MCP_CHAT_BACKEND_URL is not configured on the server." },
    { status: 500 },
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!BACKEND_URL) return missingBackendResponse();
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/conversations/${id}/messages`, {
    headers: { "x-mcp-chat-key": AUTH_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!BACKEND_URL) return missingBackendResponse();
  const { id } = await params;
  const body = await request.text();

  const backendRes = await fetch(`${BACKEND_URL}/conversations/${id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mcp-chat-key": AUTH_KEY,
    },
    body,
  });

  if (!backendRes.ok || !backendRes.body) {
    const text = await backendRes.text();
    return NextResponse.json(
      { error: text || "Backend request failed." },
      { status: backendRes.status || 502 },
    );
  }

  // Stream the SSE body straight through so the client keeps getting
  // token-by-token updates instead of waiting for the whole reply.
  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
