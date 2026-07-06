import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

// Edge-safe auth instance built from providers only (no Prisma adapter), so the
// proxy bundle stays edge-compatible. See src/auth.config.ts.
const { auth } = NextAuth(authConfig);

// Named `proxy` export (Next.js 16 renamed Middleware -> Proxy). Runs only on
// the paths in `config.matcher` below and redirects unauthenticated visitors to
// the custom sign-in page, preserving the original path as callbackUrl.
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    // Relative path only — the sign-in form rejects anything non-relative to
    // prevent an attacker-supplied absolute callbackUrl (open redirect).
    signInUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
