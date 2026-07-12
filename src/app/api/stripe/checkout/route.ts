import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getBaseUrl } from "@/lib/base-url";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured, priceIdForPlan, stripe } from "@/lib/stripe";

// POST /api/stripe/checkout — start a Pro subscription via hosted Stripe
// Checkout. Session-guarded; not in the proxy matcher, so it returns JSON (not
// an HTML redirect) on 401. Ensures the user has a Stripe Customer (creating +
// persisting one on first upgrade), then returns the Checkout session URL for
// the client to redirect to.
const bodySchema = z.object({ plan: z.enum(["monthly", "yearly"]) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { success: false, error: "Billing is not configured." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Choose a valid plan." },
      { status: 400 },
    );
  }

  const price = priceIdForPlan(parsed.data.plan);
  if (!price) {
    return NextResponse.json(
      { success: false, error: "Billing is not configured." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isPro: true, stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }
  if (user.isPro) {
    return NextResponse.json(
      { success: false, error: "You're already on Pro." },
      { status: 400 },
    );
  }

  try {
    // Reuse the saved customer, or create one and persist it so future
    // upgrades / the Billing Portal reuse the same Stripe Customer.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const base = getBaseUrl(request);
    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      success_url: `${base}/settings?checkout=success`,
      cancel_url: `${base}/settings?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    if (!checkout.url) {
      return NextResponse.json(
        { success: false, error: "Couldn't start checkout. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: { url: checkout.url } });
  } catch (error) {
    console.error("Failed to create Stripe Checkout session:", error);
    return NextResponse.json(
      { success: false, error: "Couldn't start checkout. Please try again." },
      { status: 500 },
    );
  }
}
