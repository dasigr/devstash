import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/webhook — the source of truth for a user's Pro status.
// Stripe calls this with no session, so it's NOT in the proxy matcher. The
// signature is verified against the RAW request body (never request.json()),
// then matched to a user by stripeCustomerId. Handler errors return 500 so
// Stripe retries; an unmatched customer is a safe no-op via updateMany.

/** Subscription statuses that grant Pro access. */
const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

/** Pull a Stripe id out of a string-or-expanded-object reference. */
function idOf(
  ref: string | { id: string } | null | undefined,
): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

/** Flip a user's Pro fields, matched by Stripe Customer. No-op if unmatched. */
async function syncUser(
  customerId: string | null,
  data: { isPro: boolean; stripeSubscriptionId: string | null },
): Promise<void> {
  if (!customerId) return;
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { success: false, error: "Missing signature." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json(
      { success: false, error: "Invalid signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        await syncUser(idOf(s.customer), {
          isPro: true,
          stripeSubscriptionId: idOf(s.subscription),
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        await syncUser(idOf(sub.customer), {
          isPro: ACTIVE_STATUSES.has(sub.status),
          stripeSubscriptionId: sub.id,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await syncUser(idOf(sub.customer), {
          isPro: false,
          stripeSubscriptionId: null,
        });
        break;
      }
      default:
        // Ignore unhandled event types.
        break;
    }
  } catch (error) {
    // Return 500 so Stripe retries the delivery.
    console.error(`Failed to handle Stripe webhook (${event.type}):`, error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
