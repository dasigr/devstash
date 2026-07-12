"use client";

import * as React from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/toast";

type Plan = "monthly" | "yearly";

/** Selectable billing options shown as radio-style cards. */
const PLAN_OPTIONS: {
  value: Plan;
  label: string;
  price: string;
  per: string;
  note: string;
  badge?: string;
}[] = [
  {
    value: "monthly",
    label: "Monthly",
    price: "$8",
    per: "/month",
    note: "Billed monthly. Cancel anytime.",
  },
  {
    value: "yearly",
    label: "Yearly",
    price: "$72",
    per: "/year",
    note: "$6/month, billed yearly.",
    badge: "Save 25%",
  },
];

/** Everything Pro unlocks. */
const PRO_FEATURES = [
  "Unlimited items and collections",
  "File & image uploads",
  "AI auto-tagging, summaries, and prompt optimizer",
  "Full search and export (JSON / ZIP)",
  "Priority support",
];

/**
 * Pro upgrade UI for the /upgrade page: pick a billing period, then start
 * Stripe Checkout. Mirrors BillingSection's checkout call; on success Stripe
 * redirects back to /settings, so this component doesn't handle the return.
 */
export function UpgradePlans() {
  const [plan, setPlan] = React.useState<Plan>("yearly");
  const [pending, setPending] = React.useState(false);

  async function startCheckout() {
    setPending(true);
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
        setPending(false);
        return;
      }
      window.location.href = data.data.url;
    } catch {
      toastManager.add({
        title: "Couldn't start checkout",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          Pro
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-foreground">
        Everything you need to stash without limits
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upgrade to Pro to unlock unlimited storage, uploads, and AI features.
      </p>

      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {PRO_FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-foreground">
          Choose a billing period
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PLAN_OPTIONS.map((option) => {
            const selected = plan === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPlan(option.value)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-start rounded-lg border p-4 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-background hover:bg-muted"
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  {option.badge && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
                      {option.badge}
                    </span>
                  )}
                </span>
                <span className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    {option.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {option.per}
                  </span>
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {option.note}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Button
        className="mt-6 w-full sm:w-auto"
        onClick={startCheckout}
        disabled={pending}
      >
        {pending && <Loader2 className="animate-spin" />}
        Upgrade to Pro
      </Button>
    </div>
  );
}
