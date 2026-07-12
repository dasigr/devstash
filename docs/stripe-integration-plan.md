# Stripe Integration Plan

> **Research document — not an implementation.** A complete plan for wiring Stripe subscriptions
> (DevStash Pro — **$8/mo** or **$72/yr**) into this Next.js 16 codebase. Produced by
> `/research stripe-integration-research.md`. No source code changed.

---

## 0. Findings about the current codebase (read before planning)

Much of the groundwork is **already in place** — this is a smaller lift than it looks.

| Thing | Status | Evidence |
| --- | --- | --- |
| Billing columns on `User` | ✅ **Exist** | `prisma/schema.prisma` L77–80: `isPro`, `stripeCustomerId @unique`, `stripeSubscriptionId @unique` |
| Stripe env vars | ✅ **Staged** | `.env.example` L46–51: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` |
| `stripe` SDK | ❌ **Not installed** | not in `package.json`; `node_modules/stripe` absent |
| Server Actions | ✅ **Established** | `src/actions/items.ts`, `collections.ts`, `editor-preferences.ts` (`ActionResult<T>` pattern) |
| Free-tier enforcement | ❌ **None** | no count checks in `createItem`/`createCollection`; upload route has no `isPro` gate |
| `isPro` on the session | ⚠️ **Read from DB per request** | `jwt`/`session` callbacks carry only `token.id`; `getCurrentUser()` re-reads `isPro` |

**No Prisma migration is required for this feature** — the billing fields already exist. The only
schema-adjacent work is optional data (see §3).

Patterns that already exist and **must be mirrored**:

- **`src/lib/r2.ts`** — a lazily-built, memoized third-party client with an `isR2Configured()` guard.
  The Stripe client should be the same shape (`src/lib/stripe.ts` + `isStripeConfigured()`).
- **`src/lib/features.ts`** — plain, import-free `process.env` flag helpers. Plan limits/flags live nearby.
- **`src/lib/prisma.ts`** — singleton client (`prisma`).
- **API route pattern** — `auth()` guard → `NextResponse.json({ success, data|error }, { status })`
  (see `src/app/api/items/upload/route.ts`). Routes **not** in the `src/proxy.ts` matcher return JSON
  (not an HTML redirect) when unauthenticated — the Stripe routes must stay out of the matcher.
- **Server-action pattern** — `"use server"` → `auth()` → Zod `safeParse` → `try/catch` →
  `ActionResult<T>` (`src/actions/items.ts` L17–23, L31–58).
- **`getCurrentUser()`** (`src/lib/db/user.ts`) / **`getProfile()`** (`src/lib/db/profile.ts`) — the
  `isPro` source of truth for server components. Both `cache()`-wrapped and re-read every request.
- **Settings sections** — stacked `<section className="rounded-xl border border-border bg-card p-6">`
  cards in `src/app/settings/page.tsx`; the danger zone uses `border-destructive/40`.

---

## 1. Architecture & flows

### Upgrade (hosted Stripe Checkout)

```
User clicks "Upgrade" on /settings
  → POST /api/stripe/checkout { plan: "monthly" | "yearly" }
      • auth() guard
      • ensure a Stripe Customer exists (create + persist stripeCustomerId if not)
      • stripe.checkout.sessions.create({ mode: "subscription", line_items: [priceId], ... })
      • return { url }
  → client redirects to Stripe-hosted Checkout
  → on success Stripe redirects to /settings?checkout=success
```

### Provisioning (webhook — the source of truth for `isPro`)

```
Stripe → POST /api/stripe/webhook  (raw body + Stripe-Signature header)
  • stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)  ← verify
  • checkout.session.completed        → set isPro = true,  stripeSubscriptionId
  • customer.subscription.updated     → isPro = (status is active/trialing), keep subId
  • customer.subscription.deleted     → isPro = false, clear stripeSubscriptionId
  • match the user by stripeCustomerId (or subscription id)
```

### Manage / cancel (Stripe Billing Portal)

```
User clicks "Manage billing" on /settings
  → POST /api/stripe/portal
      • auth() guard; requires stripeCustomerId
      • stripe.billingPortal.sessions.create({ customer, return_url })
      • return { url }
  → client redirects to the Portal (update card, cancel, view invoices)
  → cancellation fires customer.subscription.deleted → webhook flips isPro
```

### Why no session/JWT change is needed

`src/auth.ts`'s `jwt` callback stores only `token.id`; `isPro` is **never** on the token. Every server
component that needs Pro status calls `getCurrentUser()` / `getProfile()`, which run a fresh
`prisma.user.findUnique({ select: { …, isPro } })` **on each request**. So once the webhook writes
`isPro = true`, the **next page load reflects it** — no `session.update()`, no `trigger === "update"`,
no callback edit. See the **Appendix** for the prompt's JWT-sync workaround and why it isn't used here.

---

## 2. Stripe Dashboard setup (do this first, in Test mode)

1. **Product** → create "DevStash Pro".
2. **Prices** → add two recurring prices on that product:
   - **$8.00 USD / month** → copy the price id → `STRIPE_PRICE_ID_MONTHLY`.
   - **$72.00 USD / year** → copy the price id → `STRIPE_PRICE_ID_YEARLY`.
3. **API keys** (Developers → API keys, **Test mode**):
   - Secret key → `STRIPE_SECRET_KEY` (server only).
   - Publishable key → `STRIPE_PUBLISHABLE_KEY` (not strictly needed for hosted Checkout, but staged).
4. **Billing Portal** (Settings → Billing → Customer portal) → enable it, allow cancellation, save.
5. **Webhook endpoint** (Developers → Webhooks) → add endpoint
   `https://<your-domain>/api/stripe/webhook`, subscribe to
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` →
   copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
   - For local dev, use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
     which prints a `whsec_…` to use as the local `STRIPE_WEBHOOK_SECRET`.

`.env.example` already documents all five vars; fill the real values in the ignored `.env`.

---

## 3. Files to create

### `src/lib/stripe.ts` — lazy server client (mirrors `src/lib/r2.ts`)

```ts
import Stripe from "stripe";

let client: Stripe | null = null;

/** Whether the secret key needed to talk to Stripe is present. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Lazily build (and memoize) the Stripe client so importing this module is cheap. */
export function stripe(): Stripe {
  if (client) return client;
  client = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    // Pin an API version explicitly (check the installed SDK's expected version).
    apiVersion: "2025-08-27.basil",
    typescript: true,
  });
  return client;
}

/** Resolve the app's public base URL for Checkout/Portal return URLs. */
export function appBaseUrl(): string {
  // Reuse the existing helper if suitable, else AUTH_URL / NEXTAUTH_URL.
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Map a plan choice to its configured Stripe price id. */
export function priceIdForPlan(plan: "monthly" | "yearly"): string | null {
  return plan === "yearly"
    ? process.env.STRIPE_PRICE_ID_YEARLY ?? null
    : process.env.STRIPE_PRICE_ID_MONTHLY ?? null;
}
```

> `src/lib/base-url.ts` already exists (`getBaseUrl(request)`); prefer it where a `Request` is in
> scope. `appBaseUrl()` above is the request-less variant for return URLs.

### `src/lib/plan.ts` — free-tier limits + gating helpers (pure + testable)

```ts
import { prisma } from "@/lib/prisma";

/** Freemium caps from context/project-overview.md §7. */
export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

/** Pro-only system item types (file & image uploads). */
export const PRO_ITEM_TYPES = new Set(["file", "image"]);

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number;
}

/** Can this user create another item? Pro users are unlimited. */
export async function canCreateItem(userId: string, isPro: boolean): Promise<QuotaCheck> {
  if (isPro) return { allowed: true, used: 0, limit: Infinity };
  const used = await prisma.item.count({ where: { userId } });
  return { allowed: used < FREE_ITEM_LIMIT, used, limit: FREE_ITEM_LIMIT };
}

/** Can this user create another collection? Pro users are unlimited. */
export async function canCreateCollection(userId: string, isPro: boolean): Promise<QuotaCheck> {
  if (isPro) return { allowed: true, used: 0, limit: Infinity };
  const used = await prisma.collection.count({ where: { userId } });
  return { allowed: used < FREE_COLLECTION_LIMIT, used, limit: FREE_COLLECTION_LIMIT };
}
```

> The `prisma.item.count` / `prisma.collection.count` calls mirror those already in
> `getItemStats` (`src/lib/db/items.ts` L176–179) and `getCollectionStats`
> (`src/lib/db/collections.ts` L203+). Keep the constants + the pure decision logic here so Vitest
> can cover them (the DB `count` is mocked, matching `src/lib/db/*.test.ts`).

### `src/app/api/stripe/checkout/route.ts`

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, priceIdForPlan, appBaseUrl } from "@/lib/stripe";

const bodySchema = z.object({ plan: z.enum(["monthly", "yearly"]) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ success: false, error: "Billing is not configured." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid plan." }, { status: 400 });
  }
  const priceId = priceIdForPlan(parsed.data.plan);
  if (!priceId) {
    return NextResponse.json({ success: false, error: "Plan unavailable." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isPro: true, stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 });
  }
  if (user.isPro) {
    return NextResponse.json({ success: false, error: "You already have Pro." }, { status: 400 });
  }

  try {
    // Reuse an existing customer, else create one and persist the id.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // client_reference_id is a resilient fallback for matching the user in the webhook.
      client_reference_id: user.id,
      success_url: `${appBaseUrl()}/settings?checkout=success`,
      cancel_url: `${appBaseUrl()}/settings?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ success: true, data: { url: checkout.url } });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json({ success: false, error: "Could not start checkout." }, { status: 500 });
  }
}
```

### `src/app/api/stripe/portal/route.ts`

```ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, appBaseUrl } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ success: false, error: "Billing is not configured." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ success: false, error: "No billing account found." }, { status: 400 });
  }

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appBaseUrl()}/settings`,
    });
    return NextResponse.json({ success: true, data: { url: portal.url } });
  } catch (error) {
    console.error("Failed to create billing portal session:", error);
    return NextResponse.json({ success: false, error: "Could not open billing." }, { status: 500 });
  }
}
```

### `src/app/api/stripe/webhook/route.ts` — the provisioning source of truth

```ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";

// IMPORTANT: read the RAW body for signature verification. Do NOT call request.json().
export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const subscriptionId =
          typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { isPro: true, stripeSubscriptionId: subscriptionId ?? undefined },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const active = sub.status === "active" || sub.status === "trialing";
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { isPro: active, stripeSubscriptionId: sub.id },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { isPro: false, stripeSubscriptionId: null },
        });
        break;
      }
      default:
        // Ignore unhandled event types.
        break;
    }
  } catch (error) {
    // Return 500 so Stripe retries; never leak internals.
    console.error(`Failed to handle ${event.type}:`, error);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

> **Next.js 16 body note:** App Router route handlers receive the raw body via `await request.text()`
> by default — there is **no** `bodyParser` config to disable (that was Pages Router). `updateMany`
> (not `update`) is used so a customer with no matching row is a safe no-op rather than a throw.
> Matching by `stripeCustomerId` is reliable because `/api/stripe/checkout` persists it before Checkout.

### `src/components/settings/BillingSection.tsx` (+ buttons)

A client component consistent with `ChangePasswordForm` / `DeleteAccountDialog`:

- **Free users:** show the Free vs Pro comparison and two buttons — **Go Pro (Monthly $8)** and
  **Go Pro (Yearly $72)** — each `POST`ing to `/api/stripe/checkout` with the plan, then
  `window.location.href = data.url`. Toast on error via the existing `toastManager` (`src/lib/toast.ts`).
- **Pro users:** show current plan + a **Manage billing** button `POST`ing to `/api/stripe/portal`,
  then redirecting to `data.url`.
- Read `?checkout=success|cancelled` from the URL to fire a success/cancel toast (reuse the
  `setTimeout(0)` cold-load-safe toast pattern used by `SignInForm`).

---

## 4. Files to modify

### `src/app/settings/page.tsx`

Add a Billing section between "Editor preferences" and the danger zone. `getProfile()` already returns
`isPro`, so pass it straight through:

```tsx
{/* Billing / subscription */}
<section className="rounded-xl border border-border bg-card p-6">
  <h2 className="text-base font-semibold text-foreground">Subscription</h2>
  <p className="mt-1 text-sm text-muted-foreground">
    {user.isPro ? "You're on DevStash Pro." : "Upgrade to unlock uploads, AI, and unlimited items."}
  </p>
  <div className="mt-4">
    <BillingSection isPro={user.isPro} />
  </div>
</section>
```

### Free-tier gating on creation

**Items** — in `createItem` (`src/actions/items.ts` L31): after `auth()`, load `isPro` and call
`canCreateItem`. Return a friendly `ActionResult` error when over the cap:

```ts
const user = await getCurrentUser();               // already cache()-wrapped
const quota = await canCreateItem(session.user.id, user?.isPro ?? false);
if (!quota.allowed) {
  return { success: false, error: `Free plan is limited to ${quota.limit} items. Upgrade to Pro for unlimited.` };
}
```

**Collections** — the same shape in `createCollection` (`src/actions/collections.ts` L25) using
`canCreateCollection`.

### Pro-only file/image uploads

Currently `CreateItemDialog` (`src/components/dashboard/CreateItemDialog.tsx` L38–44) offers **all seven**
types, and `src/app/api/items/upload/route.ts` has no `isPro` check. Add gating on **both** layers:

- **UI (UX only):** hide/disable the **File** and **Image** chips for free users (thread `isPro` into
  the dialog), showing an "Upgrade to Pro" hint.
- **Server (source of truth):** in `POST /api/items/upload`, after the `auth()` guard, load the user and
  `return 403` when `!isPro`. Also re-check in the `createItem` query
  (`src/lib/db/items.ts` L334) for file/image types (`PRO_ITEM_TYPES`) so a crafted payload can't bypass
  the client — mirroring how the upload route already treats client validation as UX only.

### `src/components/marketing/Pricing.tsx` (optional polish)

The public pricing block's CTAs currently point to `/register`. That's correct for logged-out
visitors — leave as-is. Optionally, a signed-in visitor's dashboard could show an **Upgrade** entry
that deep-links to `/settings#subscription`.

### `.env.example`

Already lists the five `STRIPE_*` vars (L46–51) — no change needed. Leave the user's staged edit intact.

---

## 5. Testing checklist

**Local webhook loop**

- [ ] `stripe login`, then `stripe listen --forward-to localhost:3000/api/stripe/webhook`; put the
      printed `whsec_…` in `.env` as `STRIPE_WEBHOOK_SECRET`.
- [ ] `stripe trigger checkout.session.completed` → a matching user flips to `isPro = true`.
- [ ] `stripe trigger customer.subscription.deleted` → `isPro = false`, `stripeSubscriptionId` cleared.
- [ ] Tamper the body / wrong secret → webhook returns **400** (signature verification).

**Checkout & portal (test cards)**

- [ ] Upgrade (monthly & yearly) redirects to Stripe Checkout; `4242 4242 4242 4242` completes it.
- [ ] After success, **reloading `/settings`** shows Pro (proves the DB-fresh-read path — no JWT change).
- [ ] Manage billing opens the Portal; cancelling there fires the webhook → back to Free on reload.
- [ ] `/api/stripe/checkout` and `/api/stripe/portal` return **401 JSON** when unauthenticated (they're
      outside the proxy matcher).

**Feature gating**

- [ ] As a Free user at 50 items, `createItem` returns the limit error; the 51st is blocked.
- [ ] As a Free user at 3 collections, `createCollection` returns the limit error.
- [ ] Free user cannot upload: File/Image chips hidden **and** `POST /api/items/upload` returns 403.
- [ ] Pro user: all caps lifted, uploads succeed.

**Unit tests (Vitest — `src/actions/*`, `src/lib/*` scope only)**

- [ ] `src/lib/plan.test.ts` — `canCreateItem`/`canCreateCollection` boundary logic (49/50/51, Pro
      bypass) with `prisma.*.count` mocked (`vi.mock`), matching `src/lib/db/*.test.ts`.
- [ ] Extend `src/actions/items.test.ts` / `collections.test.ts` — over-limit returns the error without
      writing; Pro user passes through.
- [ ] `npm run test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean; route table adds
      `/api/stripe/{checkout,portal,webhook}` as `ƒ`, `ƒ Proxy (Middleware)` intact.

---

## 6. Implementation order

1. `npm i stripe` (server SDK; hosted Checkout needs no client `@stripe/stripe-js`).
2. Fill `.env` from `.env.example`; do the **Stripe Dashboard setup** (§2) in Test mode.
3. `src/lib/stripe.ts` (client + config guard).
4. `src/app/api/stripe/webhook/route.ts` + local `stripe listen` — get provisioning green first.
5. `src/app/api/stripe/checkout/route.ts`, then `…/portal/route.ts`.
6. `src/components/settings/BillingSection.tsx` + wire into `src/app/settings/page.tsx`.
7. `src/lib/plan.ts` + gating in `createItem` / `createCollection` + the upload 403.
8. Vitest for `plan.ts` and the action gates; run `test` / `tsc` / `lint` / `build`.
9. Verify end-to-end (Playwright + Stripe CLI) per §5; keep everything in **Test mode** until launch.

---

## Appendix — the prompt's JWT-sync workaround (documented alternative, not recommended here)

The research prompt proposes always syncing `isPro` from the DB inside the `jwt` callback:

```ts
async jwt({ token, user }) {
  if (user) token.sub = user.id;
  if (token.sub) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { isPro: true },
    });
    token.isPro = dbUser?.isPro ?? false;
  }
  return token;
}
```

**Why it isn't needed in this codebase:** nothing reads `isPro` off the JWT/session today. Server
components resolve Pro status through `getCurrentUser()` / `getProfile()`, which already run a fresh
`findUnique` **every request**, so a webhook write is visible on the next page load. Adding the block
above would put a DB query on **every** JWT validation for a value the app doesn't consume — pure
overhead. Adopt it **only if** you later want `isPro` carried on the token/session (e.g. to read it in
the edge proxy or a client component via `useSession()` without a server round-trip); note that the
proxy uses a **separate** `NextAuth(authConfig)` instance (`src/proxy.ts`) whose edge bundle must stay
Prisma-free, so that path would need its own design. For the plan above, **leave the callbacks
unchanged**.
