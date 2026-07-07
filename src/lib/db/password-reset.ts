import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

// Password-reset tokens are stored in NextAuth's `VerificationToken` model,
// the same table used for email verification. To keep the two flows from
// colliding, reset rows are namespaced with a prefixed identifier
// (`password-reset:<email>`) while verification rows use the bare email. A
// lookup by token therefore checks the prefix before trusting a row as a reset
// token. Tokens are single-use and short-lived, so the raw value is stored
// directly (consistent with how the NextAuth adapter uses this table).

const IDENTIFIER_PREFIX = "password-reset:";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour (shorter than email verification)

/**
 * Issue a fresh password-reset token for an email, invalidating any prior reset
 * tokens for that address (so requesting a new link makes older links stop
 * working). Returns the raw token to embed in the reset link.
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  const identifier = IDENTIFIER_PREFIX + email;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

type ResetResult =
  | { status: "success"; email: string }
  | { status: "expired" }
  | { status: "invalid" };

/**
 * Consume a password-reset token and set the user's new (already-hashed)
 * password. The token is single-use: it's deleted as soon as it's matched,
 * whether or not it turns out to be valid/expired. Only rows written by
 * `createPasswordResetToken` (prefixed identifier) are accepted, so an
 * email-verification token can never be used to reset a password.
 */
export async function resetPasswordWithToken(
  token: string,
  hashedPassword: string,
): Promise<ResetResult> {
  if (!token) return { status: "invalid" };

  const record = await prisma.verificationToken.findFirst({ where: { token } });
  // Reject missing tokens and any token that isn't a password-reset token
  // (e.g. an email-verification row sharing this table).
  if (!record || !record.identifier.startsWith(IDENTIFIER_PREFIX)) {
    return { status: "invalid" };
  }

  // Always drop the token now — it's single-use whether or not it's valid.
  await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier, token: record.token },
  });

  if (record.expires < new Date()) return { status: "expired" };

  const email = record.identifier.slice(IDENTIFIER_PREFIX.length);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { status: "invalid" };

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { status: "success", email };
}
