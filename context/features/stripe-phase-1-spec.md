# Stripe Integration - Core Infrastructure (Phase 1)

## Overview

Lay the reusable foundation for Stripe subscriptions (DevStash Pro — $8/mo or $72/yr): the lazy
server-side Stripe client and the free-tier usage-limit helpers. No routes, webhooks, or UI yet — this
phase is pure library code that Vitest can cover without the Stripe CLI. Phase 2 builds the checkout,
webhook, gating, and UI on top of it.

## Requirements

- Install the `stripe` server SDK (`npm i stripe`). Hosted Checkout needs no client `@stripe/stripe-js`.
- Create `src/lib/stripe.ts` — a lazily-built, memoized Stripe client mirroring `src/lib/r2.ts`
  (same shape as its lazy client + `isR2Configured()` guard).
- Create `src/lib/plan.ts` — free-tier limit constants plus pure `canCreateItem` / `canCreateCollection`
  decision helpers (the DB `count` is the only impure part, so Vitest can mock it).
- Add unit tests `src/lib/plan.test.ts` for the usage-limit boundary logic.
- Do the Stripe Dashboard setup in **Test mode** (below) and fill the already-staged `.env` vars.
- No Prisma migration — the billing columns (`isPro`, `stripeCustomerId`, `stripeSubscriptionId`)
  already exist on `User`.

## Files to Create

1. `src/lib/stripe.ts` — exports:
   - `isStripeConfigured(): boolean` — `Boolean(process.env.STRIPE_SECRET_KEY)`.
   - `stripe(): Stripe` — lazy singleton (memoized module-level `client`), pin `apiVersion` to the
     installed SDK's expected version, `typescript: true`.
   - `appBaseUrl(): string` — request-less base URL for Checkout/Portal return URLs
     (`AUTH_URL ?? "http://localhost:3000"`, trailing slash stripped). Prefer `src/lib/base-url.ts`'s
     `getBaseUrl(request)` where a `Request` is in scope.
   - `priceIdForPlan(plan: "monthly" | "yearly"): string | null` — maps to
     `STRIPE_PRICE_ID_YEARLY` / `STRIPE_PRICE_ID_MONTHLY`.
2. `src/lib/plan.ts` — exports:
   - `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3` (from `context/project-overview.md` §7).
   - `PRO_ITEM_TYPES = new Set(["file", "image"])` (Pro-only system types; consumed in Phase 2).
   - `interface QuotaCheck { allowed: boolean; used: number; limit: number }`.
   - `canCreateItem(userId, isPro): Promise<QuotaCheck>` — Pro ⇒ `{ allowed: true, used: 0, limit: Infinity }`;
     free ⇒ `prisma.item.count({ where: { userId } })` vs `FREE_ITEM_LIMIT`.
   - `canCreateCollection(userId, isPro): Promise<QuotaCheck>` — same shape vs `FREE_COLLECTION_LIMIT`.
3. `src/lib/plan.test.ts` — Vitest cases with `prisma.*.count` mocked (`vi.mock`, matching
   `src/lib/db/*.test.ts`): boundary logic at **49 / 50 / 51** items and **2 / 3 / 4** collections
   (allowed vs blocked), and Pro-bypass (unlimited, no `count` call).

## Environment Variables

Already staged in `.env.example`; fill real Test-mode values in the ignored `.env`:

```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
```

## Stripe Dashboard Setup (Test mode, do first)

1. **Product** → create "DevStash Pro".
2. **Prices** → two recurring prices on it: $8.00/month → `STRIPE_PRICE_ID_MONTHLY`;
   $72.00/year → `STRIPE_PRICE_ID_YEARLY`.
3. **API keys** (Test mode) → Secret → `STRIPE_SECRET_KEY`; Publishable → `STRIPE_PUBLISHABLE_KEY`.
4. **Billing Portal** (Settings → Billing → Customer portal) → enable, allow cancellation, save.
5. **Webhook secret** — obtained in Phase 2 via `stripe listen` (local) or a dashboard endpoint (prod);
   set `STRIPE_WEBHOOK_SECRET` there.

## Key Gotchas

- Mirror `src/lib/r2.ts` exactly: lazy + memoized so importing the module is cheap and never throws on a
  missing key. `isStripeConfigured()` is the guard callers check before using `stripe()`.
- Keep `src/lib/plan.ts` limit constants + decision logic pure and dependency-light so Vitest can cover
  them (per `context/ai-interaction.md` testing scope: `src/actions/*`, `src/lib/*` only). The
  `prisma.*.count` calls mirror `getItemStats` / `getCollectionStats`.
- Pin the Stripe `apiVersion` to whatever the installed SDK expects (check after `npm i`).

## Testing

- `src/lib/plan.test.ts` passes (`npm run test`) — boundary + Pro-bypass cases.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. No new routes yet, so the route table
  is unchanged and `ƒ Proxy (Middleware)` stays intact.
- Manually confirm `isStripeConfigured()` returns `false` with the key unset and `true` when set.

## References

- @docs/stripe-integration-plan.md (full research/plan — §0 findings, §2 dashboard, §3 files)
- @context/project-overview.md (§7 Monetization — 50 items / 3 collections free caps)
- `src/lib/r2.ts` (lazy-client pattern to mirror), `src/lib/base-url.ts` (`getBaseUrl`)
- Stripe Node SDK: https://github.com/stripe/stripe-node
