// Browser-side OAuth2/PKCE login against the Cognito hosted UI in front of
// the MCP chat backend (mcp-trial). Mirrors backend/app/static/index.html's
// own login flow (see that repo's README) since the backend now requires a
// real Cognito access token as `Authorization: Bearer` on every
// /conversations* call - no client secret, no shared proxy key. The
// code_verifier lives only in this tab's sessionStorage between the
// redirect out and the redirect back.

export const MCP_CHAT_BACKEND_URL = process.env.NEXT_PUBLIC_MCP_CHAT_BACKEND_URL;

const VERIFIER_KEY = "mcpChatPkceVerifier";
const TOKEN_KEY = "mcpChatAccessToken";

type AuthConfig = {
  domain: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  resource: string;
};

let authConfig: AuthConfig | null = null;

async function getAuthConfig(): Promise<AuthConfig> {
  if (!authConfig) {
    const res = await fetch(`${MCP_CHAT_BACKEND_URL}/auth/config`);
    authConfig = await res.json();
  }
  return authConfig!;
}

function base64url(bytes: Uint8Array) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY)}` };
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function login() {
  const cfg = await getAuthConfig();
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(verifierBytes);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  const params = new URLSearchParams({
    client_id: cfg.client_id,
    response_type: "code",
    scope: cfg.scope,
    redirect_uri: cfg.redirect_uri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: cfg.resource,
  });
  window.location.href = `${cfg.domain}/oauth2/authorize?${params}`;
}

// Called from /mcp/chat/callback once Cognito redirects back with `?code=`.
export async function completeLoginCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;

  const verifier = sessionStorage.getItem(VERIFIER_KEY) ?? "";
  const cfg = await getAuthConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.client_id,
    code,
    redirect_uri: cfg.redirect_uri,
    code_verifier: verifier,
    resource: cfg.resource,
  });
  const res = await fetch(`${cfg.domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Token exchange failed");
  const tokens = await res.json();
  sessionStorage.setItem(TOKEN_KEY, tokens.access_token);
  sessionStorage.removeItem(VERIFIER_KEY);
  return true;
}
