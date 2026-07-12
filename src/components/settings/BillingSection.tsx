"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/lib/toast";

/**
 * Billing card for /settings. Free users see a Free-vs-Pro comparison and
 * upgrade buttons that open Stripe Checkout; Pro users get a "Manage billing"
 * button that opens the Stripe Billing Portal. On returning from Checkout,
 * `?checkout=success|cancelled` fires a toast (once) and is stripped from the URL.
 */
export function BillingSection({ isPro }: { isPro: boolean }) {
  const [pending, setPending] = React.useState<
    "monthly" | "yearly" | "portal" | null
  >(null);

  // Toast for the Checkout return. Added via setTimeout so it lands after this
  // commit's passive effects flush: arriving from Checkout is a cold full-page
  // load, and the <Toaster> provider subscribes to the shared manager in its own
  // passive effect — an immediate add() would be dropped (no queue). Mirrors the
  // pattern in SignInForm. The `toastShown` ref keeps it to a single fire across
  // StrictMode's mount → unmount → remount.
  const toastShown = React.useRef(false);
  React.useEffect(() => {
    if (toastShown.current) return;

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout !== "success" && checkout !== "cancelled") return;
    toastShown.current = true;

    const toast =
      checkout === "success"
        ? {
            title: "Welcome to Pro",
            description: "Your subscription is active. Enjoy unlimited stashing.",
            timeout: 6000,
          }
        : {
            title: "Checkout cancelled",
            description: "No charge was made. You can upgrade anytime.",
            timeout: 6000,
          };

    // Strip the flag so a refresh doesn't replay the toast.
    params.delete("checkout");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/settings?${qs}` : "/settings");

    setTimeout(() => toastManager.add(toast), 0);
  }, []);

  async function startCheckout(plan: "monthly" | "yearly") {
    setPending(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data?.url) {
        toastManager.add({
          title: "Couldn't start checkout",
          description: data.error ?? "Please try again.",
          timeout: 6000,
        });
        setPending(null);
        return;
      }
      window.location.href = data.data.url;
    } catch {
      toastManager.add({
        title: "Couldn't start checkout",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
      setPending(null);
    }
  }

  async function openPortal() {
    setPending("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data?.url) {
        toastManager.add({
          title: "Couldn't open billing",
          description: data.error ?? "Please try again.",
          timeout: 6000,
        });
        setPending(null);
        return;
      }
      window.location.href = data.data.url;
    } catch {
      toastManager.add({
        title: "Couldn't open billing",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
      setPending(null);
    }
  }

  if (isPro) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Pro
          </span>
          <span className="text-muted-foreground">
            You have unlimited items, collections, uploads, and AI features.
          </span>
        </div>
        <Button
          variant="outline"
          onClick={openPortal}
          disabled={pending !== null}
        >
          {pending === "portal" && <Loader2 className="animate-spin" />}
          Manage billing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-2 text-sm">
        {PRO_PERKS.map((perk) => (
          <li key={perk} className="flex items-center gap-2 text-muted-foreground">
            <Check className="size-4 shrink-0 text-primary" />
            {perk}
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        You&apos;re on the Free plan (50 items, 3 collections, no file/image
        uploads).
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => startCheckout("monthly")}
          disabled={pending !== null}
        >
          {pending === "monthly" && <Loader2 className="animate-spin" />}
          Go Pro — Monthly ($8/mo)
        </Button>
        <Button
          variant="outline"
          onClick={() => startCheckout("yearly")}
          disabled={pending !== null}
        >
          {pending === "yearly" && <Loader2 className="animate-spin" />}
          Go Pro — Yearly ($72/yr)
        </Button>
      </div>
    </div>
  );
}

const PRO_PERKS = [
  "Unlimited items and collections",
  "File & image uploads",
  "AI auto-tagging, summaries, and prompt optimizer",
  "Full search and export",
  "Priority support",
];
