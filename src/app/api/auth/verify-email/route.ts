import { NextResponse } from "next/server";

import { verifyEmailToken } from "@/lib/db/verification";
import { getBaseUrl } from "@/lib/base-url";

// GET /api/auth/verify-email?token=... — the link sent in the verification
// email. Consumes the token, marks the user verified, and redirects to the
// sign-in page with a status flag the UI turns into a toast.
export async function GET(request: Request) {
  const base = getBaseUrl(request);
  const token = new URL(request.url).searchParams.get("token") ?? "";

  const result = await verifyEmailToken(token);

  const flag =
    result.status === "verified" || result.status === "already-verified"
      ? "verified=1"
      : `error=${result.status}`; // "expired" | "invalid"

  return NextResponse.redirect(new URL(`/sign-in?${flag}`, base));
}
