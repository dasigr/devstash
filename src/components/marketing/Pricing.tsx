"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { PRICING_PLANS, type BillingPeriod } from "./constants";
import { marketingButton } from "./marketing-button";
import { Reveal } from "./Reveal";

/**
 * Pricing section. The monthly/yearly toggle drives the Pro price via state
 * (Free is identical across periods, so mapping over PRICING_PLANS handles both
 * cards uniformly). `aria-pressed` reflects the active period.
 */
export function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="pricing" className="py-[90px] max-[560px]:py-[66px]">
      <div className="mx-auto w-full max-w-[1160px] px-6">
        <Reveal className="mx-auto mb-[52px] max-w-[640px] text-center">
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.02em]">
            Simple pricing that scales with you
          </h2>
          <p className="mt-3.5 text-[1.08rem] text-[var(--m-text-dim)]">
            Start free. Upgrade when you outgrow it.
          </p>
        </Reveal>

        <Reveal className="mb-10 flex justify-center">
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex gap-1 rounded-full border border-[var(--m-border)] bg-[var(--m-surface)] p-1"
          >
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full px-[18px] py-2 text-[0.9rem] font-semibold transition-colors",
                  period === p
                    ? "bg-[var(--m-brand)] text-white"
                    : "text-[var(--m-text-dim)]"
                )}
              >
                {p === "monthly" ? "Monthly" : "Yearly"}
                {p === "yearly" && (
                  <span
                    className={cn(
                      "rounded-full px-[7px] py-0.5 text-[0.7rem] font-bold",
                      period === "yearly"
                        ? "bg-white/20 text-white"
                        : "bg-[color-mix(in_srgb,var(--m-note)_22%,transparent)] text-[var(--m-note)]"
                    )}
                  >
                    Save 25%
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 justify-center gap-[22px] min-[560px]:grid-cols-[repeat(2,minmax(0,340px))]">
          {PRICING_PLANS.map((plan) => {
            const price = plan.price[period];
            return (
              <Reveal key={plan.name}>
                <article
                  className={cn(
                    "relative h-full rounded-[14px] border px-7 py-[30px]",
                    plan.featured
                      ? "border-[var(--m-brand)] bg-[linear-gradient(180deg,rgba(99,102,241,0.08),var(--m-surface))] shadow-[0_30px_60px_-34px_var(--m-brand-glow)]"
                      : "border-[var(--m-border)] bg-[var(--m-surface)]"
                  )}
                >
                  {plan.badge && (
                    <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,var(--m-brand),var(--m-brand-2))] px-3.5 py-[5px] text-[0.74rem] font-bold text-white shadow-[0_6px_16px_-6px_var(--m-brand-glow)]">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="text-[1.25rem] font-semibold">{plan.name}</h3>
                  <p className="mb-1 mt-3.5 flex items-baseline gap-1">
                    <span className="text-[2.6rem] font-extrabold tracking-[-0.03em]">
                      {price.amount}
                    </span>
                    <span className="text-[0.95rem] text-[var(--m-text-mute)]">
                      {price.per}
                    </span>
                  </p>
                  <p className="mb-[22px] text-[0.9rem] text-[var(--m-text-dim)]">
                    {price.tag}
                  </p>
                  <ul className="mb-[26px] flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className={cn(
                          "flex items-start gap-2.5 text-[0.94rem]",
                          plan.featured
                            ? "text-[var(--m-text)]"
                            : "text-[var(--m-text-dim)]"
                        )}
                      >
                        <span className="mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-full bg-[rgba(99,102,241,0.12)] text-[var(--m-brand)]">
                          <Check className="size-[11px]" strokeWidth={3} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.cta.href}
                    className={marketingButton({
                      variant: plan.cta.variant,
                      block: true,
                    })}
                  >
                    {plan.cta.label}
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
