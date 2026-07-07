import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createPasswordResetToken } from "@/lib/db/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/base-url";

// POST /api/auth/forgot-password — request a password-reset link. Always
// returns a generic success so the response never reveals whether an email
// exists or whether it's a password-based account (avoids account enumeration).
export async function POST(request: Request) {
  const generic = NextResponse.json({
    success: true,
    message: "If an account exists for that email, we've sent a reset link.",
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return generic;
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return generic;

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true },
    });

    // Only send for a real, password-based account. OAuth-only accounts (no
    // password) are a no-op — resetting a password they don't have would
    // silently enable credentials login for them.
    if (user?.password) {
      const token = await createPasswordResetToken(email);
      const resetUrl = `${getBaseUrl(request)}/reset-password?token=${token}`;
      await sendPasswordResetEmail({ to: email, resetUrl });
    }
  } catch (error) {
    // Log but still return generic — don't leak internal failures to the client.
    console.error("Failed to send password reset email:", error);
  }

  return generic;
}
