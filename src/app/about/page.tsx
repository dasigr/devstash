import type { Metadata } from "next";

import {
  ABOUT_AUDIENCES,
  ABOUT_STATS,
  ABOUT_VALUES,
} from "@/components/marketing/constants";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why we built DevStash: one fast, searchable, AI-enhanced hub for all the developer knowledge that scatters across your tools.",
};

/** Centered section head (title + subtitle) shared by the two card grids. */
function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <Reveal className="mx-auto mb-[52px] max-w-[640px] text-center">
      <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.02em]">
        {title}
      </h2>
      <p className="mt-3.5 text-[1.08rem] text-[var(--m-text-dim)]">{sub}</p>
    </Reveal>
  );
}

export default function AboutPage() {
  return (
    <MarketingShell>
      {/* ---------- Page header ---------- */}
      <section className="px-6 pb-11 pt-[136px] text-center max-[560px]:pt-[112px]">
        <Reveal className="mx-auto w-full max-w-[1160px]">
          <span className="mb-5 inline-block rounded-full border border-[var(--m-border-2)] bg-white/[0.03] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--m-text-dim)]">
            Our story
          </span>
          <h1 className="text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold tracking-[-0.02em]">
            Built for developers who
            <br />
            <span className="bg-[linear-gradient(120deg,var(--m-brand)_0%,var(--m-brand-2)_45%,var(--m-image)_100%)] bg-clip-text text-transparent">
              lose things
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[1.12rem] text-[var(--m-text-dim)]">
            Snippets, prompts, commands, notes, links, and files — the essentials
            you rely on every day scatter across too many tools. DevStash exists to
            pull them back into one place.
          </p>
        </Reveal>
      </section>

      {/* ---------- Mission ---------- */}
      <section className="px-6 pb-[90px] pt-6 max-[560px]:pb-[66px]">
        <Reveal className="mx-auto max-w-[760px] text-[1.02rem] leading-[1.75] text-[var(--m-text-dim)]">
          <h2 className="text-[1.6rem] font-extrabold text-[var(--m-text)]">
            The problem we kept hitting
          </h2>
          <p className="mt-[18px]">
            Code snippets live in VS Code and Notion. The prompts that actually
            work are buried in chat history. That one Docker incantation is in a{" "}
            <code className="rounded-md bg-[var(--m-surface-2)] px-1.5 py-0.5 text-[var(--m-text)]">
              .txt
            </code>{" "}
            file — or your shell history, if you&rsquo;re lucky. Useful links rot in
            browser bookmarks. Context files sit forgotten in project folders.
          </p>
          <p className="mt-[18px]">
            The result is constant{" "}
            <strong className="text-[var(--m-text)]">context switching</strong>,
            quietly{" "}
            <strong className="text-[var(--m-text)]">lost knowledge</strong>, and{" "}
            <strong className="text-[var(--m-text)]">
              inconsistent workflows
            </strong>
            . Every developer we talked to had their own patchwork of
            half-solutions — and none of them were searchable in one place.
          </p>
          <blockquote className="mt-[18px] rounded-r-lg border-l-[3px] border-[var(--m-brand)] bg-[rgba(99,102,241,0.06)] px-[18px] py-1 text-[var(--m-text)]">
            DevStash is one fast, searchable, AI-enhanced hub for all your
            developer knowledge. Stash everything in one place, grab it in seconds.
          </blockquote>
          <p className="mt-[18px]">
            No more hunting across VS Code, Notion, chat histories, bookmarks,
            gists, and scratch files. Save it once, find it instantly, and let AI
            handle the tedious tagging and summarizing.
          </p>
        </Reveal>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="px-6 pb-[90px] max-[560px]:pb-[66px]">
        <Reveal className="mx-auto grid w-full max-w-[1160px] grid-cols-2 gap-[18px] min-[720px]:grid-cols-4">
          {ABOUT_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] px-5 py-[26px] text-center"
            >
              <div className="bg-[linear-gradient(120deg,var(--m-brand),var(--m-brand-2))] bg-clip-text text-[2.2rem] font-extrabold tracking-[-0.03em] text-transparent">
                {stat.num}
              </div>
              <div className="mt-1.5 text-[0.92rem] text-[var(--m-text-dim)]">
                {stat.label}
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ---------- What we optimize for ---------- */}
      <section className="px-6 pb-[90px] max-[560px]:pb-[66px]">
        <div className="mx-auto w-full max-w-[1160px]">
          <SectionHead
            title="What we optimize for"
            sub="Every decision comes back to these four principles."
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ABOUT_VALUES.map((value) => (
              <Reveal key={value.title}>
                <FeatureCard
                  title={value.title}
                  description={value.description}
                  accent={value.accent}
                  icon={value.icon}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Who it's for ---------- */}
      <section className="px-6 pb-[90px] max-[560px]:pb-[66px]">
        <div className="mx-auto w-full max-w-[1160px]">
          <SectionHead
            title="Who it's for"
            sub="DevStash fits however you build."
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ABOUT_AUDIENCES.map((audience) => (
              <Reveal key={audience.title}>
                <FeatureCard
                  title={audience.title}
                  description={audience.description}
                  accent={audience.accent}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <CtaBand
        title="Ready to Organize Your Knowledge?"
        subtitle="Everything you know as a developer, in one fast, searchable home."
        ctaLabel="Start stashing — free"
        ctaHref="/register"
      />
    </MarketingShell>
  );
}
