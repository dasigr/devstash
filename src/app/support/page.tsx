import type { Metadata } from "next";

import { SUPPORT_FAQS, SUPPORT_HELP } from "@/components/marketing/constants";
import { ContactForm } from "@/components/marketing/ContactForm";
import { FaqItem } from "@/components/marketing/FaqItem";
import { HelpCard } from "@/components/marketing/HelpCard";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with DevStash. Browse frequently asked questions or reach the team directly through the contact form.",
};

/** Centered section head (title + subtitle) shared by the FAQ and contact blocks. */
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

export default function SupportPage() {
  return (
    <MarketingShell>
      {/* ---------- Page header ---------- */}
      <section className="px-6 pb-11 pt-[136px] text-center max-[560px]:pt-[112px]">
        <Reveal className="mx-auto w-full max-w-[1160px]">
          <span className="mb-5 inline-block rounded-full border border-[var(--m-border-2)] bg-white/[0.03] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--m-text-dim)]">
            Support
          </span>
          <h1 className="text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold tracking-[-0.02em]">
            How can we{" "}
            <span className="bg-[linear-gradient(120deg,var(--m-brand)_0%,var(--m-brand-2)_45%,var(--m-image)_100%)] bg-clip-text text-transparent">
              help?
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[1.12rem] text-[var(--m-text-dim)]">
            Browse the most common questions, dig into the docs, or send us a
            message — we&rsquo;re happy to help you get the most out of DevStash.
          </p>
        </Reveal>
      </section>

      {/* ---------- Quick help ---------- */}
      <section className="px-6 pb-[70px]">
        <Reveal className="mx-auto grid w-full max-w-[1160px] gap-5 md:grid-cols-3">
          {SUPPORT_HELP.map((help) => (
            <HelpCard key={help.title} {...help} />
          ))}
        </Reveal>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="px-6 pb-[90px] max-[560px]:pb-[66px]">
        <div className="mx-auto w-full max-w-[1160px]">
          <SectionHead
            title="Frequently asked questions"
            sub="The quick answers to what people ask most."
          />
          <div className="mx-auto flex max-w-[760px] flex-col gap-3.5">
            {SUPPORT_FAQS.map((faq) => (
              <Reveal key={faq.question}>
                <FaqItem question={faq.question} answer={faq.answer} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Contact ---------- */}
      <section
        id="contact"
        className="scroll-mt-[88px] px-6 pb-[110px] max-[560px]:pb-[80px]"
      >
        <div className="mx-auto w-full max-w-[1160px]">
          <SectionHead
            title="Still need help?"
            sub="Send us a message and we'll get back to you."
          />
          <Reveal>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
