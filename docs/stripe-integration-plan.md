# Stripe Integration Plan — DevStash Pro

> **Status:** Research / planning document. No code has been written. This is a
> blueprint for wiring Stripe subscription billing (Pro: **$8/mo**, **$72/yr**)
> into the existing DevStash codebase, matching its established conventions.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Feature Gating Analysis](#2-feature-gating-analysis)
3. [API & Webhook Patterns](#3-api--webhook-patterns)
4. [Environment Variables](#4-environment-variables)
5. [Files to Create](#5-files-to-create)
6. [Files to Modify](#6-files-to-modify)
7. [Stripe Dashboard Setup](#7-stripe-dashboard-setup)
8. [Session / `isPro` Sync Strategy](#8-session--ispro-sync-strategy)
9. [Testing Checklist](#9-testing-checklist)
10. [Implementation Order](#10-implementation-order)

---

## 1. Current State Analysis

### 1.1 User model — billing fields already exist

[prisma/schema.prisma](../prisma/schema.prisma) `User` already carries every field
Stripe needs:

```prisma
model User {
  id            String    @id @default(cuid())
  // ...
  // Billing
  isPro                Boolean @default(false)
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique
  // ...
}
```

- `isPro` — the single boolean the whole app reads to decide Pro access.
- `stripeCustomerId` — set the first time a user starts checkout; reused for the
  Customer Portal and to match webhooks back to a user.
- `stripeSubscriptionId` — set on subscription creation; cleared on deletion.

**No migration is strictly required to ship.** An *optional* enrichment migration
(status + period end + price id) is proposed in [§6.6](#66-optional-schema-enrichment-migration)
for a richer billing UI, and must go through `prisma migrate dev` per the
migrations policy — **never `db push`**.

### 1.2 NextAuth configuration & session shape

Split-config pattern (edge-safe vs Node):

- [src/auth.config.ts](../src/auth.config.ts) — edge slice (providers only, no
  Prisma). Imported by the proxy.
- [src/auth.ts](../src/auth.ts) — full Node instance: `PrismaAdapter`,
  `session: { strategy: "jwt" }`, and `jwt`/`session` callbacks that thread only
  **`user.id`** onto the session.

Critically, **`isPro` is NOT on the JWT or session token**. The session carries
just `id` (see [src/types/next-auth.d.ts](../src/types/next-auth.d.ts)):

```typescript
interface Session { user: { id: string } & DefaultSession["user"] }
interface JWT { id?: string }
```

This is the key architectural fact for Stripe: because `isPro` is always read
**fresh from the database** (never cached in the token), a webhook that flips
`isPro` is picked up on the very next request — a plain page reload after
checkout is sufficient. See [§8](#8-session--ispro-sync-strategy).

### 1.3 How `isPro` is accessed today

Two DB helpers resolve the current user and read `isPro` straight from Postgres
on each request:

- [src/lib/db/user.ts](../src/lib/db/user.ts) → `getCurrentUser()` returns
  `{ id, name, email, image, isPro }`.
- [src/lib/db/profile.ts](../src/lib/db/profile.ts) → `getProfile()` returns the
  profile incl. `isPro`, plus `getProfileStats(userId)` (already computes
  `totalItems` / `totalCollections` / per-type counts — **directly reusable for
  free-tier limit checks**).

Consumers of `isPro` today (all read it from the DB, none from the token):

| Location | Use |
| --- | --- |
| [src/app/profile/page.tsx:69](../src/app/profile/page.tsx#L69) | "Pro" / "Free" plan label |
| [src/components/dashboard/SidebarUser.tsx:57](../src/components/dashboard/SidebarUser.tsx#L57) | sidebar plan label |
| [src/app/dashboard/page.tsx:59](../src/app/dashboard/page.tsx#L59) | currently hardcoded `isPro: false` (mock) |
| [src/lib/db/items.ts:187](../src/lib/db/items.ts#L187) | derives *type* Pro-ness (file/image), unrelated to user plan |

### 1.4 Existing subscription / payment code

**None.** There is no `stripe` dependency, no billing routes, no checkout UI.
`package.json` deps: `next-auth`, `@auth/prisma-adapter`, `bcryptjs`, `zod`,
`resend`, `@upstash/ratelimit` + `@upstash/redis`, `@prisma/*`, `pg`, ShadCN/Base
UI bits. Stripe is a greenfield addition.

---

## 2. Feature Gating Analysis

### 2.1 Free-tier limits (from `project-overview.md` §7)

| | Free | Pro |
| --- | --- | --- |
| Items | **50 total** | Unlimited |
| Collections | **3** | Unlimited |
| System types | all **except file / image** | all |
| File & image uploads | ❌ | ✅ |
| AI (auto-tag, explain, prompt optimizer) | ❌ | ✅ |
| Custom types | ❌ | ✅ (later) |
| Export (JSON / ZIP) | ❌ | ✅ |

Spec directive: *"During development, all users can access everything — but build
the foundation so Pro gating can switch on cleanly."* → Ship the limit **helpers
and a feature flag**, default the flag **off** (everything unlocked), and flip it
on when billing goes live.

### 2.2 Where counts are checked / could be checked

- **Already computed:** `getProfileStats()` runs `prisma.item.count({ where: { userId }})`
  and `prisma.collection.count({ where: { userId }})`. A limits helper should use
  the same `count` queries (cheap, indexed on `userId`).
- **Enforcement point does not exist yet.** There is **no item/collection CRUD**
  (`grep` for `prisma.item.create` / `prisma.collection.create` → nothing; no
  `src/actions/` dir). Per `coding-standards.md`, mutations will be **Server
  Actions** in `src/actions/`. The gating helpers below are designed to be called
  at the top of those future `createItem` / `createCollection` actions (tracked
  in the sibling `docs/item-crud-architecture.md`).

### 2.3 Pro-only feature touch points

- **File/Image item types** — [src/lib/db/items.ts](../src/lib/db/items.ts)
  already marks `file`/`image` types `isPro: true` via `PRO_TYPE_NAMES`. Creating
  an item of those types must be gated on the user's plan.
- **AI features** — the AI routes (see `docs/ai-integration-plan.md`) should call
  `requirePro()` before hitting OpenAI.
- **Export** — future export route gated the same way.

### 2.4 Settings page structure

There is no dedicated `/settings` route; **[src/app/profile/page.tsx](../src/app/profile/page.tsx)
is the de-facto settings page** — a server component (`await connection()`,
defensive `redirect("/sign-in")`) composed of `<section>` cards: Account info,
Usage, Change password (conditional on `hasPassword`), Danger zone.

**The Billing UI slots in as a new `<section>` card** between "Usage" and "Change
password" — an "Upgrade to Pro" CTA for free users, or "Manage subscription"
(→ Customer Portal) for Pro users. See [§5.6](#56-billing-ui-components).

---

## 3. API & Webhook Patterns

### 3.1 Route handler conventions (from the auth routes)

Every route handler in [src/app/api/auth/](../src/app/api/auth/) follows the same
shape — mirror it exactly for the Stripe routes:

- `export async function POST(request: Request)` returning
  `NextResponse.json({ success, data?/error?, ... }, { status })`.
- Session guard first: `const session = await auth(); if (!session?.user?.id) → 401`.
- Parse JSON in a `try/catch` → 400 on bad JSON; validate with a **Zod** schema →
  400 with `z.flattenError(...).fieldErrors`.
- Wrap DB work in `try/catch`, `console.error(...)`, return a generic 500.
- Rate limiting via [src/lib/rate-limit.ts](../src/lib/rate-limit.ts)
  (`checkRateLimit(key, id)` + `rateLimitResponse()`), **fails open**.

See [src/app/api/auth/register/route.ts](../src/app/api/auth/register/route.ts)
(full pattern) and [src/app/api/auth/change-password/route.ts](../src/app/api/auth/change-password/route.ts)
(session-guarded) as the templates.

### 3.2 Webhook specifics (differ from the above)

- **Signature verification, not session:** webhooks are unauthenticated by
  session. Verify Stripe's signature with `STRIPE_WEBHOOK_SECRET`.
- **Raw body required:** the App Router route must read `await request.text()`
  (the raw string) and pass it to `stripe.webhooks.constructEvent(raw, sig, secret)`.
  **Do not** `request.json()` first — parsing breaks the signature check.
- **Node runtime:** the Stripe SDK is Node-only. Add `export const runtime = "nodejs"`
  to the webhook route (and any route importing the Stripe SDK). Before writing,
  skim [node_modules/next/dist/docs/](../node_modules/next/dist/docs/) `01-app`
  route-handler guide per `AGENTS.md` (Next 16 has breaking changes).
- **Proxy is not in the way:** `proxy.ts` `matcher` is only `/dashboard/:path*`
  and `/profile/:path*`, so `/api/webhooks/stripe` is already public — no matcher
  change needed. Do **not** add API paths to the matcher.
- **Idempotency:** webhooks can be redelivered. Make handlers idempotent —
  updating `isPro`/`stripeSubscriptionId` to a derived state is naturally
  idempotent; guard against out-of-order events using subscription status.

### 3.3 Environment variable patterns

Env is read via plain `process.env.X` at call sites, documented in the
**version-controlled** [.env.example](../.env.example) (real secrets stay in the
git-ignored `.env`). Follow the same: add Stripe keys to `.env.example` with
comments, keep real values in `.env`.

---

## 4. Environment Variables

Add to `.env` (real values) and `.env.example` (documented placeholders):

```bash
# Stripe
STRIPE_SECRET_KEY=""            # sk_test_… (test mode) / sk_live_… (prod)
STRIPE_WEBHOOK_SECRET=""        # whsec_… from `stripe listen` or the Dashboard endpoint
STRIPE_PRICE_MONTHLY=""         # price_… for the $8/mo recurring price
STRIPE_PRICE_YEARLY=""          # price_… for the $72/yr recurring price

# Public site URL for building Checkout success/cancel + Portal return URLs.
# Reuse the existing AUTH_URL if you prefer a single canonical base URL.
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> `AUTH_URL` already exists for absolute links; `getBaseUrl()` in
> [src/lib/base-url.ts](../src/lib/base-url.ts) can build request-time URLs. For
> Stripe redirect URLs a server-side `process.env.AUTH_URL ?? NEXT_PUBLIC_APP_URL`
> is simplest — pick one and document it.

Optionally add a billing feature flag alongside the existing one in
[src/lib/features.ts](../src/lib/features.ts):

```bash
# When "true", enforce free-tier limits (50 items / 3 collections) and Pro
# gating. Default off so everything stays unlocked during development.
BILLING_ENABLED="false"
```

---

## 5. Files to Create

### 5.1 `src/lib/stripe.ts` — Stripe client singleton

Mirror the `prisma.ts` singleton style.

```typescript
import Stripe from "stripe";

// Server-only Stripe client. Node runtime only (never import from edge/proxy).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Pin the API version; update deliberately.
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

// Price IDs for the two Pro plans, resolved from env.
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_YEARLY!,
} as const;

export type BillingInterval = keyof typeof STRIPE_PRICES;
```

> Install: `npm install stripe`. Pin the real latest `apiVersion` the installed
> SDK expects (TS will error if it's wrong).

### 5.2 `src/lib/limits.ts` — free-tier limits & Pro gating

```typescript
import { prisma } from "@/lib/prisma";

export const FREE_LIMITS = { items: 50, collections: 3 } as const;

// System type names that require Pro (matches PRO_TYPE_NAMES in db/items.ts).
const PRO_TYPE_NAMES = new Set(["file", "image"]);

function billingEnforced(): boolean {
  return process.env.BILLING_ENABLED?.trim().toLowerCase() === "true";
}

export interface LimitCheck {
  allowed: boolean;
  used: number;
  limit: number;
}

/** Can this user create another item? Pro (or billing disabled) → always yes. */
export async function checkItemLimit(
  userId: string,
  isPro: boolean,
): Promise<LimitCheck> {
  if (isPro || !billingEnforced()) {
    return { allowed: true, used: 0, limit: FREE_LIMITS.items };
  }
  const used = await prisma.item.count({ where: { userId } });
  return { allowed: used < FREE_LIMITS.items, used, limit: FREE_LIMITS.items };
}

/** Can this user create another collection? */
export async function checkCollectionLimit(
  userId: string,
  isPro: boolean,
): Promise<LimitCheck> {
  if (isPro || !billingEnforced()) {
    return { allowed: true, used: 0, limit: FREE_LIMITS.collections };
  }
  const used = await prisma.collection.count({ where: { userId } });
  return {
    allowed: used < FREE_LIMITS.collections,
    used,
    limit: FREE_LIMITS.collections,
  };
}

/** File/image types (and later custom types) require Pro. */
export function canUseType(typeName: string, isPro: boolean): boolean {
  if (isPro || !billingEnforced()) return true;
  return !PRO_TYPE_NAMES.has(typeName.toLowerCase());
}

/** Throw-style guard for Pro-only routes (AI, export). */
export function requirePro(isPro: boolean): boolean {
  return isPro || !billingEnforced();
}
```

These are called from the future item/collection Server Actions and the AI/export
routes. Until CRUD exists, they're inert helpers.

### 5.3 `src/lib/validations/billing.ts` — Zod schema

```typescript
import { z } from "zod";

export const checkoutSchema = z.object({
  interval: z.enum(["monthly", "yearly"]),
});
```

### 5.4 `src/app/api/stripe/checkout/route.ts` — create Checkout Session

Session-guarded POST that creates (or reuses) the Stripe customer, then returns a
Checkout Session URL for the chosen interval.

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations/billing";

export const runtime = "nodejs";

const APP_URL = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = checkoutSchema.safeParse(body);
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

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, isPro: true, stripeCustomerId: true },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 },
      );
    }
    if (user.isPro) {
      return NextResponse.json(
        { success: false, error: "You already have an active subscription." },
        { status: 400 },
      );
    }

    // Reuse an existing Stripe customer, or create one and persist its id.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: STRIPE_PRICES[parsed.data.interval], quantity: 1 }],
      success_url: `${APP_URL}/profile?checkout=success`,
      cancel_url: `${APP_URL}/profile?checkout=cancelled`,
      // Redundant safety net so the webhook can always resolve the user.
      subscription_data: { metadata: { userId: user.id } },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ success: true, url: checkout.url });
  } catch (error) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
```

### 5.5 `src/app/api/stripe/portal/route.ts` — Customer Portal session

Lets Pro users manage / cancel / switch plans in Stripe's hosted portal.

```typescript
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const APP_URL = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL!;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: "No billing account found." },
        { status: 400 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL}/profile`,
    });

    return NextResponse.json({ success: true, url: portal.url });
  } catch (error) {
    console.error("Portal session creation failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
```

### 5.6 `src/app/api/webhooks/stripe/route.ts` — webhook handler

The source of truth for `isPro`. Verifies the signature against the **raw body**,
then reconciles subscription state onto the `User`.

```typescript
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// A subscription is "active" (grants Pro) in these states.
const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Raw body is REQUIRED for signature verification — do not JSON-parse first.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription && s.customer) {
          const sub = await stripe.subscriptions.retrieve(
            s.subscription as string,
          );
          await syncSubscription(sub, s.customer as string);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub, sub.customer as string);
        break;
      }
      default:
        // Ignore unrelated events.
        break;
    }
  } catch (error) {
    // Return 500 so Stripe retries a transient failure.
    console.error(`Webhook handler error for ${event.type}:`, error);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Reconcile a Stripe subscription onto the matching User (idempotent).
async function syncSubscription(sub: Stripe.Subscription, customerId: string) {
  const isActive =
    ACTIVE_STATUSES.has(sub.status) && sub.cancel_at_period_end !== true
      ? true
      : ACTIVE_STATUSES.has(sub.status); // active even if set to cancel at period end

  // Prefer metadata.userId; fall back to matching stripeCustomerId.
  const userId = sub.metadata?.userId;
  const where = userId ? { id: userId } : { stripeCustomerId: customerId };

  await prisma.user.updateMany({
    where,
    data: {
      isPro: isActive,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.status === "canceled" ? null : sub.id,
    },
  });
}
```

> `updateMany` avoids throwing when no row matches (e.g. a test event with no
> user). If the enrichment migration ([§6.6](#66-optional-schema-enrichment-migration))
> is applied, also persist `stripeSubscriptionStatus`, `stripePriceId`, and
> `stripeCurrentPeriodEnd` here.

### 5.7 Billing UI components

- **`src/components/billing/UpgradeCard.tsx`** (`"use client"`) — shown to free
  users on `/profile`. Monthly/yearly toggle; on click, `POST /api/stripe/checkout`
  with `{ interval }`, then `window.location.href = data.url`. Uses the existing
  `toastManager` ([src/lib/toast.ts](../src/lib/toast.ts)) for errors, ShadCN
  `Button`, and a pending spinner (mirror `ChangePasswordForm` /
  `DeleteAccountDialog`).
- **`src/components/billing/ManageSubscriptionButton.tsx`** (`"use client"`) —
  shown to Pro users. `POST /api/stripe/portal` → redirect to `data.url`.
- Both follow the fetch-then-`{ success, url | error }` pattern used by the
  existing client forms.

### 5.8 `src/lib/db/billing.ts` (optional convenience)

A `getBillingState(userId)` returning `{ isPro, hasStripeCustomer }` for the
profile card, if you prefer not to widen `getProfile()`.

---

## 6. Files to Modify

### 6.1 [.env.example](../.env.example) & `.env`

Add the Stripe block from [§4](#4-environment-variables).

### 6.2 [package.json](../package.json)

`npm install stripe`. (Dev-only, optional: rely on the Stripe CLI for local
webhook forwarding — no package needed.)

### 6.3 [src/app/profile/page.tsx](../src/app/profile/page.tsx)

Insert a **Billing** `<section>` after "Usage". `getProfile()` already returns
`isPro`; branch on it:

```tsx
{/* Billing */}
<section className="rounded-xl border border-border bg-card p-6">
  <h2 className="text-base font-semibold text-foreground">Billing</h2>
  {user.isPro ? (
    <>
      <p className="mt-1 text-sm text-muted-foreground">
        You’re on the Pro plan.
      </p>
      <div className="mt-4">
        <ManageSubscriptionButton />
      </div>
    </>
  ) : (
    <div className="mt-4">
      <UpgradeCard />
    </div>
  )}
</section>
```

Optionally read `?checkout=success|cancelled` from `searchParams` to fire a toast
(same cold-load-safe pattern as the sign-in toasts).

### 6.4 [src/app/dashboard/page.tsx](../src/app/dashboard/page.tsx)

Replace the hardcoded `isPro: false` (line 59) with the real value from
`getCurrentUser()` so the sidebar plan label is accurate.

### 6.5 Future Server Actions (`src/actions/items.ts`, `src/actions/collections.ts`)

When CRUD is built (`docs/item-crud-architecture.md`), call the limit helpers
first and return the standard `{ success, error }` shape:

```typescript
const { isPro, id: userId } = currentUser;

const limit = await checkItemLimit(userId, isPro);
if (!limit.allowed) {
  return {
    success: false,
    error: `Free plan is limited to ${limit.limit} items. Upgrade to Pro for unlimited.`,
  };
}
if (!canUseType(typeName, isPro)) {
  return { success: false, error: "File and image items require Pro." };
}
```

### 6.6 (Optional) Schema enrichment migration

Only if you want richer billing UI (renewal date, cancel-at-period-end banner).
Add to `User`, then `npm run db:migrate` (**never `db push`**):

```prisma
  stripePriceId            String?
  stripeSubscriptionStatus String?
  stripeCurrentPeriodEnd   DateTime?
```

Persist these in `syncSubscription()`. Not required for a functional MVP — `isPro`
alone drives all gating.

---

## 7. Stripe Dashboard Setup

1. **Create the product & prices** (test mode first):
   - Product: **DevStash Pro**.
   - Recurring price 1: **$8.00 / month** → copy `price_…` → `STRIPE_PRICE_MONTHLY`.
   - Recurring price 2: **$72.00 / year** → copy `price_…` → `STRIPE_PRICE_YEARLY`.
2. **API keys** → Developers → API keys → copy the **test** secret key
   (`sk_test_…`) → `STRIPE_SECRET_KEY`.
3. **Customer Portal** → Settings → Billing → Customer portal → activate; allow
   plan switching (monthly↔yearly), cancellation, and payment-method updates.
4. **Webhook endpoint:**
   - **Local dev:** `stripe login`, then
     `stripe listen --forward-to localhost:3000/api/webhooks/stripe` → copy the
     printed `whsec_…` → `STRIPE_WEBHOOK_SECRET`.
   - **Production:** Developers → Webhooks → Add endpoint
     `https://<domain>/api/webhooks/stripe`, subscribe to:
     `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted` → copy that
     endpoint's `whsec_…` into prod env.
5. **Test cards:** `4242 4242 4242 4242`, any future expiry / CVC / ZIP.
6. **Go live:** swap to live keys, recreate product/prices in live mode, register
   the live webhook endpoint, update prod env.

---

## 8. Session / `isPro` Sync Strategy

**Recommended: keep `isPro` off the JWT (current architecture).** Because
`getCurrentUser()` / `getProfile()` read `isPro` fresh from Postgres on every
request, a webhook update is reflected on the next server render — a plain page
reload after Checkout suffices. The Checkout `success_url` returns the user to
`/profile`, which re-fetches from the DB and shows "Pro" immediately (assuming the
webhook landed; Stripe usually delivers within seconds). This needs **no callback
changes**.

**Alternative (only if you later put `isPro` on the session token):** the research
note flags that NextAuth's `trigger === "update"` doesn't reliably refresh
DB-changed values. The workaround would be to sync `isPro` from the DB on **every**
JWT validation in [src/auth.ts](../src/auth.ts):

```typescript
async jwt({ token, user }) {
  if (user) token.id = user.id;
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isPro: true },
    });
    token.isPro = dbUser?.isPro ?? false;
  }
  return token;
}
```

> ⚠️ Trade-off: this adds a DB query to **every** request the proxy/session
> touches, and — more importantly — **breaks the edge/proxy split** if placed in
> the shared config (`auth.config.ts` must stay Prisma-free). Since the app
> already reads `isPro` from the DB in server components, **this workaround is
> unnecessary for DevStash** and is documented only for completeness. Prefer the
> recommended approach.

---

## 9. Testing Checklist

**Checkout (test mode, card `4242…`):**
- [ ] Free user clicks Upgrade (monthly) → redirected to Stripe Checkout → pays →
      returns to `/profile?checkout=success`.
- [ ] After reload, `/profile` and sidebar show **Pro**; DB row has `isPro=true`,
      `stripeCustomerId`, `stripeSubscriptionId` set.
- [ ] Yearly interval creates a subscription on the `$72/yr` price.
- [ ] Cancel on the Checkout page → `?checkout=cancelled`, still Free.
- [ ] Attempting checkout while already Pro → 400 "already have a subscription".

**Webhooks (`stripe listen` / `stripe trigger`):**
- [ ] `stripe trigger checkout.session.completed` flips `isPro`.
- [ ] `customer.subscription.deleted` sets `isPro=false`, clears
      `stripeSubscriptionId`.
- [ ] `customer.subscription.updated` (past_due / canceled status) sets
      `isPro=false`.
- [ ] Invalid/absent `stripe-signature` → 400, no DB change.
- [ ] Redelivering the same event twice leaves the same end state (idempotent).

**Customer Portal:**
- [ ] Pro user → Manage subscription → Stripe portal opens → cancel → webhook
      flips `isPro=false` → `/profile` shows Free after reload.
- [ ] Free user (no `stripeCustomerId`) → portal route returns 400.

**Feature gating (with `BILLING_ENABLED="true"`):**
- [ ] Free user at 50 items → item create action blocked with upgrade message.
- [ ] Free user at 3 collections → collection create blocked.
- [ ] Free user creating a `file`/`image` item → blocked.
- [ ] Pro user → unlimited, all types allowed.
- [ ] With `BILLING_ENABLED="false"` (default) → everything unlocked regardless
      of plan.

**Auth / security:**
- [ ] All Stripe routes 401 when unauthenticated (except the webhook).
- [ ] Webhook route is reachable without a session (not caught by proxy matcher).
- [ ] `npm run build`, `npm run lint`, `tsc --noEmit` clean.

---

## 10. Implementation Order

Sequenced so each step is independently verifiable:

1. **Deps & env** — `npm install stripe`; add Stripe vars to `.env` + `.env.example`;
   create the product/prices in the Stripe test Dashboard.
2. **Stripe client** — `src/lib/stripe.ts`.
3. **Webhook first** — `src/app/api/webhooks/stripe/route.ts` + `stripe listen`.
   Verify signature handling and `syncSubscription` with `stripe trigger` before
   any UI exists. This is the riskiest piece; nail it early.
4. **Checkout route** — `src/app/api/stripe/checkout/route.ts`; drive it with a
   temporary button or curl; confirm end-to-end `isPro` flip via the webhook.
5. **Portal route** — `src/app/api/stripe/portal/route.ts`.
6. **Billing UI** — `UpgradeCard` + `ManageSubscriptionButton`; wire the Billing
   section into `/profile`; fix the dashboard `isPro` mock.
7. **Limits helpers** — `src/lib/limits.ts` + `BILLING_ENABLED` flag (inert until
   CRUD exists; unit-verify the count queries against the dev branch).
8. **Gate future CRUD** — when item/collection Server Actions land, call the limit
   helpers (cross-refs `docs/item-crud-architecture.md`).
9. **(Optional)** enrichment migration for renewal-date UI.
10. **Verify** — full checklist in [§9](#9-testing-checklist); `npm run build` +
    lint clean before committing.

---

## Appendix — Key File Reference

| Concern | File |
| --- | --- |
| Billing schema fields | [prisma/schema.prisma](../prisma/schema.prisma) `User` |
| Full auth instance / callbacks | [src/auth.ts](../src/auth.ts) |
| Edge auth slice | [src/auth.config.ts](../src/auth.config.ts) |
| Session type augmentation | [src/types/next-auth.d.ts](../src/types/next-auth.d.ts) |
| Read current user + `isPro` | [src/lib/db/user.ts](../src/lib/db/user.ts) |
| Profile + usage counts | [src/lib/db/profile.ts](../src/lib/db/profile.ts) |
| Settings/billing surface | [src/app/profile/page.tsx](../src/app/profile/page.tsx) |
| Route handler template | [src/app/api/auth/register/route.ts](../src/app/api/auth/register/route.ts) |
| Session-guarded route template | [src/app/api/auth/change-password/route.ts](../src/app/api/auth/change-password/route.ts) |
| Rate-limit utility | [src/lib/rate-limit.ts](../src/lib/rate-limit.ts) |
| Feature-flag pattern | [src/lib/features.ts](../src/lib/features.ts) |
| Prisma singleton pattern | [src/lib/prisma.ts](../src/lib/prisma.ts) |
| Proxy matcher (routes protected) | [src/proxy.ts](../src/proxy.ts) |
| Toast manager | [src/lib/toast.ts](../src/lib/toast.ts) |
</content>
</invoke>
