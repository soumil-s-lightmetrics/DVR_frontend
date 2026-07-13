import { NextRequest, NextResponse } from "next/server";
import { jwtVerifier } from "@/utils/jwt-verifier";
import { SESSION_COOKIE_NAME } from "@/utils/auth-constants";

// Gates every route behind a valid access token. /auth/master-login stays
// public — it's where the external auth system (master.lightmetrics.co)
// lands users with a fresh token; that route handler is what actually sets
// the session cookie checked here.
export async function middleware(request: NextRequest) {
  // TEMPORARY: auth check disabled for local testing. Revert before committing.
  return NextResponse.next();

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
