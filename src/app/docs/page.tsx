import type { Metadata } from "next";
import Link from "next/link";
import { Info, Sparkles } from "lucide-react";

import { Callout } from "@/components/marketing/Callout";
import { DocsSection } from "@/components/marketing/DocsSection";
import { DocsToc } from "@/components/marketing/DocsToc";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Learn how to use DevStash: item types, collections, search, AI features, and keyboard shortcuts.",
};

export default function DocsPage() {
  return (
    <MarketingShell>
      {/* ---------- Page header ---------- */}
      <section className="px-6 pb-10 pt-[136px] text-center max-[560px]:pt-[112px]">
        <Reveal className="mx-auto w-full max-w-[1160px]">
          <span className="mb-5 inline-block rounded-full border border-[var(--m-border-2)] bg-white/[0.03] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--m-text-dim)]">
            Docs
          </span>
          <h1 className="text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold tracking-[-0.02em]">
            <span className="bg-[linear-gradient(120deg,var(--m-brand)_0%,var(--m-brand-2)_45%,var(--m-image)_100%)] bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[1.12rem] text-[var(--m-text-dim)]">
            Learn how to use DevStash: item types, collections, search, AI
            features, and keyboard shortcuts.
          </p>
        </Reveal>
      </section>

      {/* ---------- TOC + content ---------- */}
      <section className="px-6 pb-[90px]">
        <div className="mx-auto grid w-full max-w-[1160px] items-start gap-12 md:grid-cols-[232px_1fr]">
          <DocsToc />

          <div className="min-w-0 max-w-[760px]">
            {/* Getting started */}
            <DocsSection id="getting-started">
              <h2>Getting started</h2>
              <p>
                DevStash is one fast, searchable, AI-enhanced hub for all your
                developer knowledge — snippets, prompts, commands, notes, links,
                and files. Everything you save is an <strong>Item</strong>, and
                every item has a <strong>type</strong>.
              </p>
              <Callout icon={Info}>
                New here? Create your first snippet, then hit <code>⌘K</code> to
                see how fast it is to find again.
              </Callout>
            </DocsSection>

            {/* Creating items */}
            <DocsSection id="creating-items">
              <h2>Creating items</h2>
              <p>
                Click <strong>New Item</strong> in the top bar, pick a type, and
                fill in the fields. Text types get a title and content; links
                take a URL; files and images take an upload. Add tags to make
                them easy to find later.
              </p>
              <ul>
                <li>
                  Snippets and commands open in a syntax-highlighted code editor.
                </li>
                <li>Notes and prompts use a markdown write/preview editor.</li>
                <li>
                  Every item can be pinned, favorited, and added to collections.
                </li>
              </ul>
            </DocsSection>

            {/* Item types */}
            <DocsSection id="item-types">
              <h2>Item types</h2>
              <p>DevStash ships with seven built-in system types:</p>
              <ul>
                <li>
                  <strong>Snippet</strong> — reusable, language-aware code.
                </li>
                <li>
                  <strong>Prompt</strong> — the AI prompts that work, versioned
                  and tagged.
                </li>
                <li>
                  <strong>Note</strong> — markdown notes and explanations.
                </li>
                <li>
                  <strong>Command</strong> — terminal commands you&rsquo;d
                  otherwise re-derive.
                </li>
                <li>
                  <strong>Link</strong> — useful URLs, out of your bookmarks bar.
                </li>
                <li>
                  <strong>File</strong> <em>(Pro)</em> — context files and docs.
                </li>
                <li>
                  <strong>Image</strong> <em>(Pro)</em> — screenshots and
                  diagrams.
                </li>
              </ul>
              <p>
                Each type has its own color and icon, used consistently across
                the app.
              </p>
            </DocsSection>

            {/* Collections */}
            <DocsSection id="collections">
              <h2>Collections</h2>
              <p>
                Collections group items of any type. An item can live in{" "}
                <strong>multiple collections</strong> at once — a React snippet
                could sit in both <em>React Patterns</em> and{" "}
                <em>Interview Prep</em>.
              </p>
              <p>
                Create a collection from the top bar or the sidebar, then add
                items to it from the item&rsquo;s edit form. A collection card is
                tinted by the type it holds most.
              </p>
            </DocsSection>

            {/* Search */}
            <DocsSection id="search">
              <h2>Search</h2>
              <p>
                Open the command palette with <code>⌘K</code> (or{" "}
                <code>Ctrl K</code>) and search across content, titles, tags, and
                types. Results are grouped into Items and Collections and ranked
                by relevance.
              </p>
              <pre className="text-[#c9d1d9]">
                <code>
                  <span className="text-[#79c0ff]">⌘K</span> {" →  "}type{" "}
                  <span className="text-[#a5d6ff]">&quot;debounce&quot;</span>
                  {"  →  "}jump straight to the snippet
                </code>
              </pre>
            </DocsSection>

            {/* AI */}
            <DocsSection id="ai">
              <h2>
                AI features{" "}
                <span className="ml-1 inline-block rounded-full border border-transparent bg-[linear-gradient(135deg,var(--m-prompt),#fb923c)] px-2.5 py-1 align-middle text-[0.8rem] font-semibold text-white">
                  Pro
                </span>
              </h2>
              <p>On Pro, AI helps with the tedious parts:</p>
              <ul>
                <li>
                  <strong>Auto-tagging</strong> — suggested tags the moment you
                  paste.
                </li>
                <li>
                  <strong>Summaries</strong> — a one-line description from your
                  content.
                </li>
                <li>
                  <strong>Explain this code</strong> — a plain-English walkthrough
                  of any snippet.
                </li>
                <li>
                  <strong>Prompt optimizer</strong> — sharpen a prompt, then apply
                  the rewrite.
                </li>
              </ul>
              <Callout icon={Sparkles}>
                AI actions run only when you click — nothing is sent
                automatically.
              </Callout>
            </DocsSection>

            {/* Shortcuts */}
            <DocsSection id="shortcuts">
              <h2>Keyboard shortcuts</h2>
              <ul>
                <li>
                  <code>⌘K</code> / <code>Ctrl K</code> — open search.
                </li>
                <li>
                  <code>Enter</code> — open the selected result.
                </li>
                <li>
                  <code>Esc</code> — close the palette or drawer.
                </li>
              </ul>
              <p>
                Need something that isn&rsquo;t covered here? Head to{" "}
                <Link href="/support">Support</Link> — the FAQ or the contact
                form will get you sorted.
              </p>
            </DocsSection>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
