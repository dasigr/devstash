# Support Page

## Overview

Turn the static prototype `prototypes/homepage/support.html` into the real Support page at `/support`, replacing the current placeholder (`src/app/support/page.tsx`). Reproduce the prototype's **look and content** — a page header, a **quick-help card row** (3 cards), an **FAQ list** (7 Q&As), and a **contact form** — rebuilt as React server components plus one small client `ContactForm` for interactivity, using Tailwind + the existing marketing primitives. Don't copy raw HTML/CSS.

This is the 5th marketing-page rebuild from this prototype folder, mirroring the completed **About**, **Blog Listing/Detail**, and **Documentation** features (`context/features/about-page-spec.md`, `documentation-page-spec.md`) — same shell, `--m-*` tokens, `Reveal`, and `constants.ts` data-array pattern. Unlike those, the contact form submits to a **real `POST /api/support` route** that emails the team via the existing Resend integration.

## Route & Auth

- Stays at `src/app/support/page.tsx`, a **server component** wrapped in the existing `MarketingShell` (`src/components/marketing/MarketingShell.tsx`), which already provides `MarketingNav`, `Footer`, the `.marketing` token scope, and the ambient glow.
- **Public** — no `auth()` redirect and no `proxy.ts` matcher change. The `POST /api/support` route is likewise **not** added to the proxy matcher (public visitors must be able to submit; unauthenticated calls get JSON, not an HTML redirect).
- `metadata`: keep `title: "Support"`; add the `description` from the prototype `<head>` ("Get help with DevStash. Browse frequently asked questions or reach the team directly through the contact form.").
- Footer already links **Support → `/support`** and the nav is correct — no nav/footer wiring changes.

## Component Architecture

Server-first. Place new components under `src/components/marketing/`. The only client piece is `ContactForm`.

| Component | Kind | Notes |
| --- | --- | --- |
| `HelpCard` | server | Presentational quick-help card: centered brand-tinted icon tile + `<h3>` + `<p>`, wrapped in a `next/link`. Props `{ icon: LucideIcon; title; description; href }`. Port `.help-card` (hover lift + brand glow). Mapped from `SUPPORT_HELP`. |
| `FaqItem` | server | One FAQ entry: `<h3>` with a monospace brand `Q.` marker (`aria-hidden`) + the question, and a `<p>` answer (may contain inline `<code>`). Props `{ question: string; answer: ReactNode }`. Port `.faq-item`. |
| `ContactForm` | **client** (`"use client"`) | Controlled Name/Email/Subject/Message fields → on submit `fetch("/api/support", { method: "POST", body: JSON })`, disable while pending, toast success/error via `toastManager` (`src/lib/toast.ts`), reset on success, surface inline field errors from the response `issues`. Mirrors the auth forms (e.g. `ForgotPasswordForm` / `SignInForm`). |

**Page composition** (`page.tsx`, each block wrapped in `Reveal`):

| Section | Source | Notes |
| --- | --- | --- |
| Page header | `.page-header` | `pill` ("Support") + gradient `<h1>` ("How can we *help?*", second word gradient) + dim subtitle. Reuse the pill + gradient-text patterns from `Hero`/About. |
| Quick help | `.help-cards` | 3 `HelpCard`s from `SUPPORT_HELP`. Grid 3 → 1 col. |
| FAQ | `.section__head` + `.faq` | Section head (h2 "Frequently asked questions" + sub) + `SUPPORT_FAQS.map(FaqItem)` in a `max-w-[760px]` column. |
| Contact | `.section__head#contact` + `.contact-form` | Section head ("Still need help?" + sub) + `<ContactForm />`. The section wrapper carries `id="contact"` + `scroll-mt` so the "Email the team" help card can anchor to it. |

Reuse the shared section-head treatment via a small local `SectionHead` helper (as About/Docs did — centered, `max-w-[640px]`, h2 + dim sub).

**Data arrays** (add to `src/components/marketing/constants.ts`, following `FEATURES`/`ABOUT_*`/`DOCS_NAV`):

- `SUPPORT_HELP: { icon: LucideIcon; title: string; description: string; href: string }[]` —
  - Read the docs (`BookOpen` or `FileText`) → `/docs`
  - Join the community (`Users`) → `#` (placeholder, consistent with other footer stubs like Changelog/Careers)
  - Email the team (`Mail`) → `#contact` (in-page anchor to the form)
- `SUPPORT_FAQS: { question: string; answer: ReactNode }[]` — the **7 Q&As copied verbatim** from the prototype: What is DevStash / free plan / Pro cost ($8/mo, $72/yr) / Pro features / item types / How does search work (keeps inline `<code>⌘K</code>` + `<code>Ctrl K</code>`) / GitHub sign-in. `answer` is `ReactNode` so the search entry can embed the `<code>` elements.

## Contact API (real, Resend-backed)

- **Schema** — new `src/lib/validations/support.ts` → `supportSchema` (Zod, mirroring `src/lib/validations/auth.ts`): `name` `.trim().min(1).max(100)`, `email` `.trim().toLowerCase().email()`, `subject` `.trim().min(1).max(200)`, `message` `.trim().min(1).max(5000)`. Export the `SupportInput` type.
- **Email helper** — add `sendSupportEmail({ name, email, subject, message })` to `src/lib/email.ts`, reusing the existing `resend` client + `FROM`. Sends **to** a support inbox (env `SUPPORT_EMAIL`, with a sensible fallback constant), sets **`replyTo: email`** so replies reach the sender, `subject: `[Support] ${subject}``, and an inline HTML template in the same style as `verificationEmailHtml`/`passwordResetEmailHtml` (name, email, subject, message). Throws on Resend error (caller decides how to surface).
- **Rate limit** — add a `support` entry to `RATE_LIMITS` in `src/lib/rate-limit.ts`: `{ limit: 3, window: "1 h", prefix: "rl:support" }`, keyed by **IP** (`getClientIp`) to curb spam on the public endpoint. Reuse `checkRateLimit` / `rateLimitResponse` (fails open).
- **Route** — new `POST /api/support` (`src/app/api/support/route.ts`), modeled on `src/app/api/auth/forgot-password/route.ts`:
  1. Rate-limit by IP → `rateLimitResponse` on a 429.
  2. Parse JSON (guard a bad body).
  3. `supportSchema.safeParse` → **400** with `{ success: false, issues }` (via `z.flattenError`) for inline field errors.
  4. `sendSupportEmail(...)` in try/catch → `{ success: true }` on success, generic **500** on a delivery failure (log the real error, don't leak it).
  - Not added to the proxy matcher.

## Styling

Tailwind utilities + the `--m-*` marketing tokens (already in `globals.css`, scoped to `.marketing`). **No new `globals.css` classes** — port the prototype's support styles (`styles.css:963–1044`) to Tailwind **arbitrary values**:

- **Help cards** (`.help-cards` / `.help-card` / `.help-card__icon`): `grid gap-5 md:grid-cols-3`; card = `text-center rounded-[var(--m-radius)] border border-[var(--m-border)] bg-[var(--m-surface)] px-6 py-[30px]` + hover lift/`border-[var(--m-brand)]`/brand glow; icon tile = `size-12 rounded-xl grid place-items-center text-[var(--m-brand)] bg-[rgba(99,102,241,0.14)]`.
- **FAQ** (`.faq` / `.faq-item`): column `mx-auto max-w-[760px] flex flex-col gap-3.5`; item = surface card, `<h3>` flex with a `flex-shrink-0 font-mono text-[var(--m-brand)]` `Q.` marker, dim `<p>`.
- **Contact form** (`.contact-form`): `mx-auto max-w-[620px] rounded-[var(--m-radius)] border border-[var(--m-border)] bg-[var(--m-surface)] p-[30px]`; `.form-row` = `grid gap-4 sm:grid-cols-2`; fields = label (`text-[0.86rem] font-semibold`) + input/textarea (`w-full bg-[var(--m-bg)] border border-[var(--m-border-2)] rounded-[10px] px-3.5 py-[11px]`, brand focus ring, textarea `resize-y min-h-[130px]`). Submit = `marketingButton({ variant: "primary", size: "lg", block: true })` on the `<button>`.
- **Page header** / section heads: reuse About's pill + gradient-`<h1>` + dim subtitle and the shared `SectionHead`.

**Rationale for not using ShadCN `Input`/`Textarea`:** the marketing surface deliberately uses `--m-*` tokens (matching `FeatureCard` and the About/Docs rebuilds), not the app's oklch theme components — consistent with the prior four pages.

## Responsive

- Help cards 3 → 1 col; contact `.form-row` 2 → 1 col (prototype breakpoint ~640px).
- Page header / headings clamp down as in the homepage/About sections.
- No horizontal overflow at 390px.

## Testing & Scope

- **Unit tests** (Vitest scope covers `src/lib/*`): new `src/lib/validations/support.test.ts` for `supportSchema` — valid parse; each field required / trimmed / over-max rejected; email normalized (trim + lowercase) and an invalid email rejected. The page, components, and route are out of scope (Vitest covers `src/actions/*` + `src/lib/*` only). The existing suite must still pass.
- **Verify:** `npm run test`, `tsc --noEmit`, `npm run lint`, `npm run build` (`/support` static, `/api/support` `ƒ`, `ƒ Proxy (Middleware)` intact). In the browser (Playwright): all four blocks render; help cards link to `/docs` / `#` / `#contact` (and "Email the team" scrolls to the form); the FAQ renders 7 items with the inline `⌘K` code; a valid submit toasts success (real Resend send — verify to the configured support inbox, or note deferral if no verified domain); invalid input shows inline errors + a 400; the rate limit fires after 3 submits; `POST /api/support` works **unauthenticated** (public); mobile collapses to a single column with no overflow at 390px. Assert any modal/drawer state with `[data-slot=…]`, never `[role=dialog]` (the mobile sidebar `<aside>` matches the latter).
- **Out of scope:** the other interior pages, storing tickets in the DB, attachments / captcha beyond rate limiting, and real content beyond the prototype copy.

## Files

- **New:** `src/app/support/page.tsx` (replace placeholder), `src/app/api/support/route.ts`, `src/lib/validations/support.ts`, `src/lib/validations/support.test.ts`, `src/components/marketing/HelpCard.tsx`, `src/components/marketing/FaqItem.tsx`, `src/components/marketing/ContactForm.tsx`.
- **Edit:** `src/components/marketing/constants.ts` (`SUPPORT_HELP`, `SUPPORT_FAQS`), `src/lib/email.ts` (`sendSupportEmail`), `src/lib/rate-limit.ts` (`support` entry), `.env.example` (`SUPPORT_EMAIL`).
- **Reuse:** `MarketingShell`, `Reveal`, `marketing-button.ts`, the `Hero` pill/gradient patterns, `toastManager` (`src/lib/toast.ts`), `getClientIp` / `checkRateLimit` / `rateLimitResponse`, and the `z.flattenError` 400-with-`issues` pattern from the auth routes.
