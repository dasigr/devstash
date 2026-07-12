import Stripe from "stripe";

// Server-side Stripe client for subscriptions (DevStash Pro). Mirrors the lazy
// pattern in src/lib/r2.ts: the client is built on first use and memoized, so
// importing this module is cheap and never throws when STRIPE_SECRET_KEY is
// unset. Callers guard with isStripeConfigured() before using stripe().

let client: Stripe | null = null;

/** Whether the Stripe secret key needed to talk to the API is present. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Lazily build (and memoize) the Stripe client. The apiVersion is pinned to the
 * version the installed SDK expects; with `typescript: true` a mismatch is a
 * compile error.
 */
export function stripe(): Stripe {
  if (client) return client;
  client = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
  });
  return client;
}

/**
 * Request-less base URL for Checkout/Portal return URLs. Prefer
 * `getBaseUrl(request)` from src/lib/base-url.ts where a Request is in scope
 * (it also honors NEXTAUTH_URL and hardens against Host spoofing in production).
 */
export function appBaseUrl(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Map a subscription plan to its configured Stripe Price id (null if unset). */
export function priceIdForPlan(plan: "monthly" | "yearly"): string | null {
  const priceId =
    plan === "yearly"
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;
  return priceId ?? null;
}
