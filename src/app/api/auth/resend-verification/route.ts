import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validations/auth";
import { createEmailVerificationToken } from "@/lib/db/verification";
import { sendVerificationEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/base-url";

// POST /api/auth/resend-verification — re-send the verification email for an
// unverified credentials account. Always returns a generic success so the
// response never reveals whether an email exists or is already verified
// (avoids account enumeration).
export async function POST(request: Request) {
  const generic = NextResponse.json({
    success: true,
    message: "If that account needs verification, we've sent a new link.",
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return generic;
  }

  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return generic;

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true, emailVerified: true },
    });

    // Only re-send for a real, password-based, still-unverified account.
    // OAuth-only accounts (no password) and already-verified users are no-ops.
    if (user?.password && !user.emailVerified) {
      const token = await createEmailVerificationToken(email);
      const verifyUrl = `${getBaseUrl(request)}/api/auth/verify-email?token=${token}`;
      await sendVerificationEmail({ to: email, verifyUrl });
    }
  } catch (error) {
    // Log but still return generic — don't leak internal failures to the client.
    console.error("Failed to resend verification email:", error);
  }

  return generic;
}
