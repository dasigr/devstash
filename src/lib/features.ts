// Feature flags read from environment variables. Keep these as plain
// `process.env` reads (no imports) so they stay usable from any runtime.

/**
 * Whether email verification is required for email/password accounts.
 *
 * When **enabled**, registration sends a verification email and unverified
 * users are blocked at sign-in. When **disabled** (the default), registration
 * skips the email and sign-in is not gated on `emailVerified`.
 *
 * Defaults to `false` so the app is usable without a verified Resend domain
 * (the shared `onboarding@resend.dev` sender can only deliver to the Resend
 * account owner). Set `EMAIL_VERIFICATION_ENABLED="true"` to turn it on.
 */
export function isEmailVerificationEnabled(): boolean {
  return process.env.EMAIL_VERIFICATION_ENABLED?.trim().toLowerCase() === "true";
}
