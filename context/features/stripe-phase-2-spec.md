# Stripe Integration - Integration & UI (Phase 2)

## Overview

Build on Phase 1's Stripe client and usage-limit helpers to deliver the full subscription flow: hosted
Checkout, the Billing Portal, the webhook that is the source of truth for `isPro`, free-tier gating on
item/collection creation and file/image uploads, and the `/settings` Billing UI. This phase needs the
**Stripe CLI** for the local webhook loop. Requires Phase 1 merged.

## Requirements

- Add `POST /api/stripe/checkout` — auth guard, ensure a Stripe Customer exists (create + persist
  `stripeCustomerId`), create a subscription Checkout session, return `{ url }`.
- Add `POST /api/stripe/portal` — auth guard, require `stripeCustomerId`, create a Billing Portal
  session, return `{ url }`.
- Add `POST /api/stripe/webhook` — verify the signature against the **raw** body, handle
  `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` to
  write `isPro` / `stripeSubscriptionId`, matched by `stripeCustomerId`.
- Gate creation on the free tier: `createItem` (`FREE_ITEM_LIMIT`) and `createCollection`
  (`FREE_COLLECTION_LIMIT`) return a friendly `ActionResult` error when over cap.
- Gate file/image uploads to Pro on **both** layers: hide/disable the File & Image chips in
  `CreateItemDialog` for free users (UX), and enforce with a **403** in `POST /api/items/upload` plus a
  `PRO_ITEM_TYPES` re-check in the `createItem` query (source of truth).
- Add a Billing section to `/settings` (upgrade buttons for free users; "Manage billing" for Pro).
- Extend action unit tests for the new gates.

## Files to Create

1. `src/app/api/stripe/checkout/route.ts` — `auth()` → `isStripeConfigured()` guard →
   Zod `{ plan: "monthly" | "yearly" }` → resolve `priceIdForPlan` → load user (401/already-Pro 400) →
   reuse or create the Stripe Customer (persist `stripeCustomerId`) →
   `stripe().checkout.sessions.create({ mode: "subscription", customer, line_items: [{ price, quantity: 1 }],
   client_reference_id: user.id, success_url: ".../settings?checkout=success",
   cancel_url: ".../settings?checkout=cancelled", allow_promotion_codes: true })` → `{ success, data: { url } }`.
2. `src/app/api/stripe/portal/route.ts` — `auth()` → config guard → require `stripeCustomerId` (else 400) →
   `stripe().billingPortal.sessions.create({ customer, return_url: ".../settings" })` → `{ success, data: { url } }`.
3. `src/app/api/stripe/webhook/route.ts` — read `await request.text()` (raw), verify with
   `stripe().webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` (400 on missing sig /
   bad signature), switch on event type, use `prisma.user.updateMany({ where: { stripeCustomerId }, ... })`
   so an unmatched customer is a safe no-op; 500 on handler error so Stripe retries; else `{ received: true }`.
4. `src/components/settings/BillingSection.tsx` — client component (consistent with
   `ChangePasswordForm` / `DeleteAccountDialog`):
   - Free: Free-vs-Pro comparison + **Go Pro (Monthly $8)** / **Go Pro (Yearly $72)** buttons that POST
     to `/api/stripe/checkout` then `window.location.href = data.url`.
   - Pro: current plan + **Manage billing** button POSTing to `/api/stripe/portal` then redirecting.
   - Read `?checkout=success|cancelled` to fire a toast via `toastManager` (`src/lib/toast.ts`), using the
     `setTimeout(0)` cold-load-safe toast pattern from `SignInForm`.

## Files to Modify

- `src/app/settings/page.tsx` — add a `<section>` Billing card (matching the stacked
  `rounded-xl border border-border bg-card p-6` cards) between "Editor preferences" and the danger zone;
  pass `isPro` from the existing `getProfile()` into `<BillingSection isPro={user.isPro} />`.
- `src/actions/items.ts` (`createItem`) — after `auth()`, load `isPro` via `getCurrentUser()` and call
  `canCreateItem`; return `{ success: false, error: "Free plan is limited to 50 items. Upgrade to Pro for unlimited." }`
  when over cap (no write).
- `src/actions/collections.ts` (`createCollection`) — same shape with `canCreateCollection`.
- `src/app/api/items/upload/route.ts` — after `auth()`, load the user and `return 403` when `!isPro`.
- `src/lib/db/items.ts` (`createItem` query) — re-check `PRO_ITEM_TYPES` for file/image types so a crafted
  payload can't bypass the client (mirrors how the upload route treats client validation as UX only).
- `src/components/dashboard/CreateItemDialog.tsx` — thread `isPro`; hide/disable the **File** and **Image**
  type chips for free users with an "Upgrade to Pro" hint.
- Extend `src/actions/items.test.ts` and `src/actions/collections.test.ts` — over-limit returns the error
  without writing; a Pro user passes through.

## Environment Variables

Uses the same five `STRIPE_*` vars from Phase 1. For local webhooks, the `whsec_…` printed by
`stripe listen` is the local `STRIPE_WEBHOOK_SECRET`.

## Key Gotchas

- **Webhook raw body:** App Router route handlers read the raw body via `await request.text()` — do NOT
  call `request.json()` (there's no Pages-Router `bodyParser` to disable). Signature verification depends
  on the exact raw bytes.
- **Keep all three Stripe routes OUT of the `src/proxy.ts` matcher** so unauthenticated calls return JSON
  (not an HTML redirect) — matching `src/app/api/items/upload/route.ts`. The webhook must be reachable by
  Stripe (no session).
- Use `updateMany` (not `update`) in the webhook so a customer with no matching row is a no-op, not a throw.
- **No session/JWT change needed:** nothing reads `isPro` off the token; `getCurrentUser()` / `getProfile()`
  re-read `isPro` from the DB every request, so a webhook write is visible on the next page load.
- No Prisma migration — billing columns already exist.

## Testing

**Local webhook loop (Stripe CLI):**
- `stripe login`, then `stripe listen --forward-to localhost:3000/api/stripe/webhook`; put the printed
  `whsec_…` in `.env`.
- `stripe trigger checkout.session.completed` → matching user flips to `isPro = true`.
- `stripe trigger customer.subscription.deleted` → `isPro = false`, `stripeSubscriptionId` cleared.
- Tampered body / wrong secret → webhook returns **400**.

**Checkout & portal (test cards):**
- Upgrade (monthly & yearly) redirects to Checkout; `4242 4242 4242 4242` completes it; reloading
  `/settings` shows Pro (proves the DB-fresh-read path).
- Manage billing opens the Portal; cancelling there → webhook → back to Free on reload.
- `/api/stripe/checkout` and `/api/stripe/portal` return **401 JSON** when unauthenticated.

**Feature gating:**
- Free user at 50 items: `createItem` returns the limit error; 51st blocked. At 3 collections:
  `createCollection` blocked.
- Free user cannot upload: File/Image chips hidden **and** `POST /api/items/upload` returns 403.
- Pro user: all caps lifted, uploads succeed.

**Suite:** `npm run test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` clean; route table adds
`/api/stripe/{checkout,portal,webhook}` as `ƒ`, `ƒ Proxy (Middleware)` intact.

## References

- @docs/stripe-integration-plan.md (§1 flows, §3 route code, §4 modifications, §5 testing, Appendix)
- @context/features/stripe-phase-1-spec.md (the `stripe()` client + `canCreate*` helpers this builds on)
- Existing patterns: `src/app/api/items/upload/route.ts` (route shape / out-of-matcher),
  `src/actions/items.ts` (`ActionResult<T>`), `src/components/settings/ChangePasswordForm.tsx`,
  `src/app/settings/page.tsx` (section card style)
- Stripe: Checkout https://stripe.com/docs/checkout, Webhooks https://stripe.com/docs/webhooks,
  Billing Portal https://stripe.com/docs/billing/subscriptions/customer-portal
