import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { registerSchema } from "@/lib/validations/auth";
import { createEmailVerificationToken } from "@/lib/db/verification";
import { sendVerificationEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/base-url";
import { isEmailVerificationEnabled } from "@/lib/features";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/auth/register — email/password sign-up.
// Validates input (Zod), ensures the email is free, hashes the password with
// bcrypt, and creates the user. Sign-in itself is handled by the Credentials
// provider (see src/auth.ts).
export async function POST(request: Request) {
  // Rate limit by IP (3 / hour) to curb automated sign-up abuse.
  const rate = await checkRateLimit("register", getClientIp(request));
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

  const parsed = registerSchema.safeParse(body);
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

  const { name, email, password } = parsed.data;
  const verificationEnabled = isEmailVerificationEnabled();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });

    // Send the verification email (only when the feature is enabled). A
    // delivery failure shouldn't fail the registration itself — the account
    // exists and the user can request a fresh link via "resend verification"
    // — so we log and continue. When disabled, we leave `emailVerified` null;
    // sign-in works because the gate in src/auth.ts is skipped.
    if (verificationEnabled) {
      try {
        const token = await createEmailVerificationToken(email);
        const verifyUrl = `${getBaseUrl(request)}/api/auth/verify-email?token=${token}`;
        await sendVerificationEmail({ to: email, verifyUrl });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
        verificationRequired: verificationEnabled,
      },
      { status: 201 },
    );
  } catch (error) {
    // Unique-constraint race: a concurrent request registered this email
    // between our existence check and create.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
