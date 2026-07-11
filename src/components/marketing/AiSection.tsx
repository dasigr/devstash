import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { AI_CHECKLIST, AI_TAGS } from "./constants";
import { marketingButton } from "./marketing-button";
import { Reveal } from "./Reveal";

/**
 * AI/Pro section: a Pro badge + capability checklist on the left, and a static
 * code-editor mockup with an "AI Generated Tags" demo (staggered fade-in) on
 * the right.
 */
export function AiSection() {
  return (
    <section className="py-[90px] max-[560px]:py-[66px]">
      <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 items-center gap-14 px-6 min-[900px]:grid-cols-2 min-[900px]:gap-14">
        <Reveal>
          <span className="mb-5 inline-block rounded-full bg-[linear-gradient(135deg,var(--m-prompt),#fb923c)] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white">
            Pro Feature
          </span>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.02em]">
            Let AI do the tedious part
          </h2>
          <p className="mt-4 text-[1.08rem] text-[var(--m-text-dim)]">
            Auto-tagging, summaries, code explanations, and a prompt optimizer —
            powered by AI, right where you work.
          </p>
          <ul className="my-7 flex flex-col gap-[13px]">
            {AI_CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--m-note),#16a34a)] text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-[var(--m-text)]">{item}</span>
              </li>
            ))}
          </ul>
          <Link href="#pricing" className={marketingButton()}>
            Unlock AI features
          </Link>
        </Reveal>

        <Reveal>
          <div className="overflow-hidden rounded-[14px] border border-[var(--m-border-2)] bg-[#0d1117] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-[7px] border-b border-[var(--m-border)] bg-[#161b22] px-3.5 py-[11px]">
              <span className="size-[11px] rounded-full bg-[#ff5f57]" />
              <span className="size-[11px] rounded-full bg-[#febc2e]" />
              <span className="size-[11px] rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-[0.8rem] text-[var(--m-text-mute)]">
                useDebounce.ts
              </span>
            </div>
            <pre className="overflow-x-auto px-5 py-[18px] font-mono text-[0.82rem] leading-[1.65] text-[#c9d1d9]">
              <code>
                <span className="text-[#ff7b72]">export function</span>{" "}
                <span className="text-[#d2a8ff]">useDebounce</span>&lt;T&gt;(value:
                T, delay = <span className="text-[#79c0ff]">300</span>) {"{"}
                {"\n"}  <span className="text-[#ff7b72]">const</span> [debounced,
                setDebounced] = <span className="text-[#d2a8ff]">useState</span>
                (value);{"\n"}  <span className="text-[#d2a8ff]">useEffect</span>(()
                =&gt; {"{"}
                {"\n"}    <span className="text-[#ff7b72]">const</span> id ={" "}
                <span className="text-[#d2a8ff]">setTimeout</span>(() =&gt;{" "}
                <span className="text-[#d2a8ff]">setDebounced</span>(value), delay);
                {"\n"}    <span className="text-[#ff7b72]">return</span> () =&gt;{" "}
                <span className="text-[#d2a8ff]">clearTimeout</span>(id);{"\n"}  {"}"}
                , [value, delay]);{"\n"}  <span className="text-[#ff7b72]">return</span>{" "}
                debounced;{"\n"}
                {"}"}
              </code>
            </pre>
            <div className="border-t border-[var(--m-border)] bg-[#0f141b] px-5 pb-[18px] pt-3.5">
              <span className="mb-3 inline-flex items-center gap-1.5 text-[0.76rem] font-semibold text-[var(--m-prompt)]">
                <Sparkles className="size-3.5" />
                AI Generated Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {AI_TAGS.map((tag, i) => (
                  <span
                    key={tag}
                    className="m-tag rounded-full border border-[var(--m-border-2)] bg-[var(--m-surface-2)] px-[11px] py-1 text-[0.78rem] text-[var(--m-text)]"
                    style={{ animationDelay: `${0.1 + i * 0.15}s` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
