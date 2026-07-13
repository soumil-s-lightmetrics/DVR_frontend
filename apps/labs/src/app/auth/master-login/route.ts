import { NextRequest, NextResponse } from "next/server";
import { jwtVerifier } from "@/utils/jwt-verifier";
import { SESSION_COOKIE_NAME } from "@/utils/auth-constants";

// Landing target for the external auth system's redirect
// (https://labs.lightmetrics.co/auth/master-login?access_token=<jwt>).
// Verifies the token once here, then stores it in an httpOnly cookie so
// middleware can re-verify it on subsequent requests without the token
// sitting in the URL/browser history.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("access_token");

  if (!token) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  try {
    await jwtVerifier.verify(token);
  } catch (err) {
    console.error("master-login: token verification failed", err);
    return NextResponse.json({ error: "Invalid access_token" }, { status: 401 });
  }

  
  // Behind Amplify's compute layer, request.url reflects the internal Host the
  // Next.js process sees (e.g. localhost:3000), not the public domain the user
  // is actually on — that arrives via x-forwarded-host/-proto instead.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = forwardedHost
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${forwardedHost}`
    : request.nextUrl.origin;

  const response = NextResponse.redirect(new URL("/", origin));
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // matches the token's own 1h expiry
  });
  return response;
}
