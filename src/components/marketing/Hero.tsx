import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ChaosField } from "./ChaosField";
import { DashboardPreview } from "./DashboardPreview";
import { marketingButton } from "./marketing-button";
import { Reveal } from "./Reveal";

/**
 * Landing hero: headline + CTAs, then the "chaos → order" showcase
 * (scattered-tools panel → transform arrow → mini dashboard preview).
 */
export function Hero() {
  return (
    <section className="pb-[90px] pt-[128px] max-[560px]:pt-[104px]">
      <div className="mx-auto w-full max-w-[1160px] px-6">
        <Reveal className="mx-auto mb-14 max-w-[760px] text-center">
          <span className="mb-[22px] inline-block rounded-full border border-[var(--m-border-2)] bg-white/[0.03] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--m-text-dim)]">
            Your developer knowledge, finally in one place
          </span>
          <h1 className="text-[clamp(2.3rem,6vw,4rem)] font-extrabold tracking-[-0.02em]">
            Stop Losing Your{" "}
            <span className="block bg-[linear-gradient(120deg,var(--m-brand)_0%,var(--m-brand-2)_45%,var(--m-image)_100%)] bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mt-[22px] max-w-[620px] text-[1.12rem] text-[var(--m-text-dim)]">
            Snippets in VS Code. Prompts in chat history. Commands in a random{" "}
            <code className="rounded-md bg-[var(--m-surface-2)] px-1.5 py-px text-[var(--m-text)]">
              .txt
            </code>
            . Links buried in bookmarks. DevStash pulls it all into one fast,
            searchable, AI-enhanced hub.
          </p>
          <div className="mt-[34px] flex flex-wrap justify-center gap-3.5">
            <Link href="/register" className={marketingButton({ size: "lg" })}>
              Start stashing — free
            </Link>
            <a
              href="#features"
              className={marketingButton({ variant: "outline", size: "lg" })}
            >
              See how it works
            </a>
          </div>
        </Reveal>

        <Reveal className="grid grid-cols-1 items-center gap-7 min-[900px]:grid-cols-[1fr_auto_1fr]">
          <ChaosField />

          <div
            aria-hidden="true"
            className="m-arrow mx-auto grid size-16 place-items-center rounded-full bg-[linear-gradient(135deg,var(--m-brand),var(--m-brand-2))] text-white"
          >
            <ArrowRight className="size-10" strokeWidth={2.5} />
          </div>

          <DashboardPreview />
        </Reveal>
      </div>
    </section>
  );
}
