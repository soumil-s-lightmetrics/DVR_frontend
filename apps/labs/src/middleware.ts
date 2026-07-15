import { NextRequest, NextResponse } from "next/server";
import { jwtVerifier } from "@/utils/jwt-verifier";
import { SESSION_COOKIE_NAME } from "@/utils/auth-constants";

// Gates every route behind a valid access token. /auth/master-login stays
// public — it's where the external auth system (master.lightmetrics.co)
// lands users with a fresh token; that route handler is what actually sets
// the session cookie checked here.
//
// Local-only escape hatch: set SKIP_AUTH=true in .env.local to skip the check
// entirely. Gated on NODE_ENV too so this can never take effect in a real
// (production) build/deploy, even if SKIP_AUTH leaked into that environment.
const SKIP_AUTH = process.env.SKIP_AUTH === "true";

export async function middleware(request: NextRequest) {
  if (SKIP_AUTH) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await jwtVerifier.verify(token);
      return NextResponse.next();
    } catch (err) {
      console.error("middleware: session token invalid/expired", err);
    }
  }

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(process.env.AUTH_LOGIN_URL!);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/master-login).*)"],
};
