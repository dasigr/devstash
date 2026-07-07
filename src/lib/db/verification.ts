import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

// Email verification tokens are stored in NextAuth's `VerificationToken` model
// (identifier = email, token = random secret, expires = TTL). We reuse it
// rather than adding a column. Tokens are single-use and expiring, so the raw
// value is stored directly (consistent with how the NextAuth adapter uses this
// table).

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Issue a fresh verification token for an email, invalidating any prior tokens
 * for that address (so a re-send makes older links stop working). Returns the
 * raw token to embed in the verification link.
 */
export async function createEmailVerificationToken(
  email: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}

type VerifyResult =
  | { status: "verified"; email: string }
  | { status: "already-verified"; email: string }
  | { status: "expired" }
  | { status: "invalid" };

/**
 * Consume a verification token: mark the associated user's email verified and
 * delete the token. Handles missing/expired tokens gracefully. Idempotent for
 * an already-verified user (still clears the token).
 */
export async function verifyEmailToken(token: string): Promise<VerifyResult> {
  if (!token) return { status: "invalid" };

  const record = await prisma.verificationToken.findFirst({ where: { token } });
  if (!record) return { status: "invalid" };

  // Always drop the token now — it's single-use whether or not it's valid.
  await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier, token: record.token },
  });

  if (record.expires < new Date()) return { status: "expired" };

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
    select: { id: true, emailVerified: true },
  });
  if (!user) return { status: "invalid" };

  if (user.emailVerified) {
    return { status: "already-verified", email: record.identifier };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  return { status: "verified", email: record.identifier };
}
