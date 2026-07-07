# Auth Security Review

**Last audited:** 2026-07-07
**Scope:** NextAuth v5 credentials + GitHub, email verification, password reset, profile — areas NextAuth does not handle automatically.

## Summary

Overall posture is strong: password hashing, token generation, single-use/expiry enforcement, account-enumeration resistance, and session/IDOR checks are implemented correctly and consistently across every route reviewed. No Critical or High findings. One Medium finding (Host-header trust in link generation) and one Medium finding (no rate limiting, reported once per the audit scope) were identified, plus a couple of Low nits.

## Findings

### Critical
_None._

### High
_None._

### Medium

- **Password-reset / verification links trust the client-supplied Host header when `AUTH_URL`/`NEXTAUTH_URL` is unset** — `src/lib/base-url.ts:4-8`
  - **Issue:** `getBaseUrl(request)` only prefers `AUTH_URL`/`NEXTAUTH_URL` when one is actually set to a non-empty string; `.env.example:16` ships `AUTH_URL=""`, so on a deployment that leaves it unset, `getBaseUrl` falls through to `new URL(request.url).origin`, which reflects the incoming `Host` header. This value is then embedded directly in the verification link (`src/app/api/auth/register/route.ts:66`), the resend-verification link (`src/app/api/auth/resend-verification/route.ts:46`), and the password-reset link (`src/app/api/auth/forgot-password/route.ts:41`) that get emailed to the user. If the deployment (or a proxy in front of it) doesn't strictly validate the `Host`/`X-Forwarded-Host` header against the real domain, an attacker can trigger a password-reset or verification email for a victim with a spoofed `Host` header so the emailed link points at an attacker-controlled domain while carrying a real, valid token — classic "password-reset-link poisoning." Risk is mitigated on platforms (e.g. Vercel production domains) that reject mismatched hosts, but is not mitigated by anything in this codebase.
  - **Fix:** Require `AUTH_URL` (or a dedicated `APP_URL`) to be set in every real environment and stop falling back to the request origin in production (fail closed, or only allow the fallback in `NODE_ENV !== "production"`); alternatively validate the derived host against an explicit allow-list before using it to build outbound links.

- **No rate limiting or throttling on any auth endpoint** — `src/auth.ts` (Credentials `authorize`), `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/resend-verification/route.ts`, `src/app/api/auth/change-password/route.ts`
  - **Issue:** None of these routes apply any per-IP or per-account throttling. This exposes sign-in to credential-stuffing/brute-force, registration and resend-verification to email-bombing, reset/change-password to brute-forcing the current password or token, and (secondarily) provides no defense-in-depth against timing-based account enumeration. This is expected — NextAuth does not provide rate limiting out of the box — but is worth tracking as a single, deliberate gap rather than leaving unaddressed indefinitely.
  - **Fix:** Add a lightweight limiter (e.g. an in-memory token-bucket for dev, Upstash/Redis-backed for production) keyed by IP and by account identifier (email) in front of sign-in, register, forgot-password, reset-password, resend-verification, and change-password — e.g. 5-10 requests per identifier per 15 minutes, with a generic 429 response that doesn't distinguish reasons.

### Low

- **`resend-verification` allows requesting a new token even while a still-valid one exists** — `src/lib/db/verification.ts:24` (`createEmailVerificationToken` unconditionally `deleteMany`s + recreates on every resend)
  - **Issue:** Not a vulnerability (the previous token is correctly invalidated), but combined with the missing rate limit above, a user (or attacker who knows/guesses a registered but unverified email) can trigger unlimited Resend sends, one email per request, with no cooldown. This is really the same root cause as the Medium rate-limiting finding above and doesn't need a separate fix — noted only so a rate limiter is scoped to include this route specifically with a short per-email cooldown (e.g. 60s) in addition to the broader per-IP/per-account limits.

## Passed Checks

- **Hashing:** bcryptjs at a consistent **12 rounds** across `src/app/api/auth/register/route.ts:52`, `src/app/api/auth/reset-password/route.ts:37`, `src/app/api/auth/change-password/route.ts:76`, and `prisma/seed.ts:320`. All comparisons use `bcrypt.compare` (`src/auth.ts:48`, `src/app/api/auth/change-password/route.ts:64`) — never a raw `===` on hashes.
- **No hash leakage:** `getProfile()` (`src/lib/db/profile.ts:26-42`) `select`s `password` only to derive a boolean `hasPassword` and destructures it out of the returned object before returning; `register`'s response `select`s only `{ id, name, email }` (`src/app/api/auth/register/route.ts:55`); `change-password`/`forgot-password`/`resend-verification` all select `password` solely to branch on truthiness, never returning it.
- **Generic `authorize`:** `src/auth.ts:38-63` returns `null` uniformly for invalid input, missing user, OAuth-only account (no password hash), and wrong password — the only differentiated signal is the intentional `EmailNotVerifiedError` (correct password, unverified email), gated by `isEmailVerificationEnabled()`.
- **Password policy:** shared Zod schemas enforce an 8-character minimum consistently at every entry point — `credentialsSchema`/`registerSchema`/`resetPasswordSchema`/`changePasswordSchema` in `src/lib/validations/auth.ts`, applied server-side in every corresponding route and mirrored client-side in the forms.
- **Email verification tokens:** `crypto.randomBytes(32)` hex tokens (`src/lib/db/verification.ts:21`), 24h expiry actually checked on consume (`verifyEmailToken`, line 54), single-use (`deleteMany` on consume regardless of outcome, lines 50-52) and prior tokens invalidated on reissue (line 24). `verify-email`/`resend-verification` never reveal whether an account exists (`src/app/api/auth/resend-verification/route.ts:14-54` always returns the same generic body).
- **Password reset tokens:** separate `crypto.randomBytes(32)` tokens namespaced under `password-reset:<email>` (`src/lib/db/password-reset.ts:13,22-32`) so a verification token can never be used to reset a password (the `startsWith(IDENTIFIER_PREFIX)` guard at line 55); **1h** expiry, shorter than the 24h verification TTL, actually enforced (line 64); single-use — deleted on consume whether valid or expired (lines 59-62). `forgot-password` always returns a generic response (`src/app/api/auth/forgot-password/route.ts:13-16`) and is a no-op for OAuth-only accounts (`user?.password` guard, line 39) rather than silently granting them a password.
- **Profile/API authorization:** every mutating/reading route calls `auth()` and rejects with 401 when there's no session (`change-password/route.ts:14-20`, `account/route.ts:11-17`, `profile/page.tsx:32-34` defensive redirect). All mutations are scoped via `where: { id: session.user.id }` (`change-password/route.ts:47-49,77-79`, `account/route.ts:20`) — no route accepts a client-supplied user id.
- **Change-password / delete-account correctness:** change-password requires and `bcrypt.compare`s the current password before updating (`change-password/route.ts:64-74`) and rejects OAuth-only accounts with `code: "no_password"` (lines 52-62); delete-account is authenticated, scoped to the session user, and relies on the schema's `onDelete: Cascade` on `Item`, `Collection`, `ItemType`, `Account`, and `Session` (`prisma/schema.prisma:36,48,111,133,152`).
- **`getProfile`/`getProfileStats`:** scoped to `session.user.id`, `select`s only the fields the UI needs, and never touches another user's rows (`src/lib/db/profile.ts:78-91` all queries filtered `where: { userId }`).
- **Open-redirect hardening:** `src/proxy.ts:20-23` emits a relative `callbackUrl` (`pathname + search`, never an absolute URL); `SignInForm.safeCallbackUrl()` (`src/components/auth/SignInForm.tsx:43-45`) only accepts a single-leading-slash relative path, rejecting `//host` and absolute URLs, and is applied to both the credentials redirect and the GitHub `callbackUrl`.
- **No account-linking risk:** `GitHub` and `Credentials` providers are registered with no `allowDangerousEmailAccountLinking`, so the Auth.js/adapter default (no automatic linking across providers by email) applies.
- **Feature flag context:** `isEmailVerificationEnabled()` (`src/lib/features.ts`) defaulting off is a documented, intentional project decision (no Resend-verified domain yet) — not a vulnerability, and every gated code path (`authorize`, register, resend-verification) handles both states correctly.

## Out of Scope (handled by NextAuth)

CSRF tokens, session cookie flags (`httpOnly`/`sameSite`/`secure`), OAuth `state`/PKCE, and JWT session encryption/signing are managed by NextAuth v5 itself and were intentionally not audited here.
