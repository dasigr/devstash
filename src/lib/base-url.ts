// Resolve the app's public base URL for building absolute links (e.g. email
// verification and password-reset links). Always prefers an explicit
// AUTH_URL/NEXTAUTH_URL.
//
// The incoming request's Host header is attacker-controllable, so we only fall
// back to the request origin outside production. In production a missing config
// throws rather than trusting Host — otherwise a spoofed Host could poison the
// origin baked into emailed verification/reset links (link poisoning).
export function getBaseUrl(request: Request): string {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_URL (or NEXTAUTH_URL) must be set in production to build absolute links safely."
    );
  }

  return new URL(request.url).origin;
}
