import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getBaseUrl } from "@/lib/base-url";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured, stripe } from "@/lib/stripe";

// POST /api/stripe/portal — open the Stripe Billing Portal so a Pro user can
// manage or cancel their subscription. Session-guarded; not in the proxy
// matcher, so it returns JSON (not an HTML redirect) on 401. Requires a saved
// Stripe Customer (set on the first Checkout).
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

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getBaseUrl(request)}/settings`,
    });
    return NextResponse.json({ success: true, data: { url: portal.url } });
  } catch (error) {
    console.error("Failed to create Stripe Billing Portal session:", error);
    return NextResponse.json(
      { success: false, error: "Couldn't open billing. Please try again." },
      { status: 500 },
    );
  }
}
