import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetPasswordWithToken } from "@/lib/db/password-reset";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/auth/reset-password — complete a password reset. Validates the new
// password, hashes it (bcrypt, 12 rounds — matching register/seed), then
// consumes the single-use token and updates the user's password.
export async function POST(request: Request) {
  // Rate limit by IP (5 / 15 min) to curb token brute-forcing.
  const rate = await checkRateLimit("resetPassword", getClientIp(request));
  if (!rate.success) return rateLimitResponse(rate);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        issues: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await resetPasswordWithToken(token, hashedPassword);

    if (result.status === "success") {
      return NextResponse.json({ success: true });
    }

    // "expired" | "invalid" — the token was consumed (if it existed) but can't
    // complete the reset. Surface a distinct code so the UI can guide a retry.
    return NextResponse.json(
      {
        success: false,
        code: result.status,
        error:
          result.status === "expired"
            ? "This reset link has expired. Please request a new one."
            : "This reset link is invalid or has already been used.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
