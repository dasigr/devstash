# Documentation Page

## Overview

Turn the static prototype `prototypes/homepage/docs.html` into the real Documentation page at `/docs`, replacing the current placeholder (`src/app/docs/page.tsx`, which renders only `<h1>Documentation</h1>`). Reproduce the prototype's **look and content** — a sticky sidebar **table of contents** beside a prose content column with **7 sections** (Getting started, Creating items, Item types, Collections, Search, AI features, Keyboard shortcuts) — rebuilt as React server components plus one small client component for the TOC scroll-spy, using Tailwind + the existing marketing primitives. Don't copy raw HTML/CSS.

This mirrors the completed **About Page** / **Blog Listing** features (`context/features/about-page-spec.md`, `blog-listing-page-spec.md`), reusing the same shell, tokens, `Reveal`, and `constants.ts` data-array pattern.

## Route & Auth

- Stays at `src/app/docs/page.tsx`, a **server component** wrapped in the existing `MarketingShell` (`src/components/marketing/MarketingShell.tsx`), which already provides `MarketingNav`, `Footer`, the `.marketing` token scope, and the ambient glow.
- **Public** — no `auth()` redirect and no `proxy.ts` matcher change (marketing page; signed-in users may view it). Builds `○ (Static)` like `/about` and `/blogs`.
- `metadata`: keep `title: "Documentation"`; add the `description` from the prototype `<head>` ("Learn how to use DevStash: item types, collections, search, AI features, and keyboard shortcuts.").

The Footer already links **Docs → `/docs`** and the nav is already correct, so no nav/footer wiring changes.

## Component Architecture

Server-first. The page renders a **two-column layout** (`docs-layout`): a sticky TOC sidebar + a prose content column. Place new components under `src/components/marketing/`.

| Component | Kind | Notes |
| --- | --- | --- |
| `DocsToc` | **client** (`"use client"`) | Renders the TOC groups from the `DOCS_NAV` data array. An `IntersectionObserver` scroll-spy tracks which section is in view and sets the active id → `aria-current="location"` + active styling (brand text + `--m-surface` bg) on the matching anchor. Links are in-page anchors (`#getting-started`, …); clicks scroll to the section (`scroll-mt` on each section handles the nav offset). Sticky on desktop (`md:sticky md:top-[88px]`), collapses to a wrapped horizontal bordered row on mobile. |
| `DocsSection` | server | Wrapper giving each section its `id`, `scroll-mt-[84px]` (nav height 64 + 20), and the between-section divider (`[&+&]:mt-10 [&+&]:border-t [&+&]:pt-10 border-[var(--m-border)]`). Children carry the shared prose classes (see DRY reuse). |
| `Callout` | server | Small presentational: leading icon (lucide, `aria-hidden` wrapper) + content, brand-tinted (`border-[color-mix(in_srgb,var(--m-brand)_30%,var(--m-border))]`, `bg-[rgba(99,102,241,0.07)]`, `rounded-[10px]`, `p-4`). Props `{ icon: LucideIcon; children }`. Used twice: the "New here?" info note (`Info` icon) and the "AI actions run only when you click" note (`Sparkles` icon). |

**Content** is authored as **inline JSX** inside `DocsSection`s in `page.tsx` — the sections are heterogeneous (paragraphs, `<ul>`, callouts, a code block, inline `<code>`, a Pro pill), so a rich content data model isn't worth it; this matches how About rendered its prose inline. Wrap the page header (and optionally the content column) in `Reveal` for the scroll fade-in.

**Page composition** (`page.tsx`): `MarketingShell` → a `max-w-[1160px]` container → the `docs-layout` grid holding `<DocsToc />` (left) and the content column of `<DocsSection id=…>` blocks (right). Copy all section prose **verbatim** from the prototype.

## DRY reuse

- **Prose typography:** extract the child-selector className list currently inlined in `Prose.tsx` into a shared exported constant (e.g. `export const proseClassName = "…"` in `Prose.tsx` or a small sibling), and have both `Prose` and `DocsSection` consume it. This reuses the existing marketing article typography (paragraphs, headings, inline `<code>`, `<pre>`, `<ul>`, `<strong>`, `<a>`) rather than restyling per element.
- Reuse `Reveal`, the **pill** pattern (About's inline pill classes — `rounded-full border border-[var(--m-border-2)] bg-white/[0.03] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--m-text-dim)]`; a tiny local `Pill` helper is optional), the gradient-text pattern from `Hero`/About, and the `--m-*` tokens.
- Add **`DOCS_NAV`** to `src/components/marketing/constants.ts` following the `FEATURES`/`ABOUT_*` pattern — an array of groups `{ heading: string; links: { id: string; label: string }[] }` (Getting Started, Concepts, Power features). It is the **single source of truth** for both the TOC render and the scroll-spy observed ids, keeping the sidebar and section ids from drifting.

## Search-section code block

Port the prototype's `.code-block` + `tok-*` spans (`⌘K → type "debounce" → jump straight to the snippet`) to an inline styled `<pre>` reusing the `[&_pre]` prose treatment (`#0d1117`, `border-[var(--m-border-2)]`, `overflow-x-auto`) with a couple of accent-colored `<span>`s (e.g. `text-[#79c0ff]` for the string). Full per-token syntax highlighting is out of scope.

## Links & Buttons

Nav + footer come from `MarketingShell` (already correct: brand → `/`, Sign In → `/sign-in`, Get Started → `/register`). This page adds only:

| Element | Destination |
| --- | --- |
| TOC anchors | in-page `#<section-id>` |
| Shortcuts section "Support" link | `/support` (prototype's `support.html`; the route already exists) |
| Inline `⌘K` references | plain `<code>`, no link |

## Styling

Tailwind utilities + the `--m-*` marketing tokens (already in `globals.css`, scoped to `.marketing`). No new `globals.css` classes — port the prototype's docs styles (`styles.css:910–961`, plus `.pill--pro` at ~121 and `.code-block` at ~748) to Tailwind **arbitrary values**:

- **Layout** (`.docs-layout`): `grid gap-12 md:grid-cols-[232px_1fr] items-start`, top padding clearing the fixed nav.
- **TOC** (`.docs-sidebar` / `.docs-nav__group`): sticky column; group `<h4>` = `text-[0.74rem] uppercase tracking-[0.06em] text-[var(--m-text-mute)]`; links = `block rounded-lg px-2.5 py-1.5 text-[0.9rem] text-[var(--m-text-dim)] hover:bg-[var(--m-surface)] hover:text-[var(--m-text)]`; active = brand text + `--m-surface` bg.
- **Section** (`.docs-section`): `scroll-mt-[84px]`; `h2` ≈ `text-[1.7rem] font-extrabold`; divider between sections.
- **Callout** (`.callout`) and **Pro pill** (`.pill--pro` = `text-white border-transparent bg-[linear-gradient(135deg,var(--m-prompt),#fb923c)]`) as above.
- **Page header**: reuse About's pill + gradient-`<h1>` + dim subtitle treatment.

## Responsive

- Two-column → **single column** under `md` (prototype breakpoint ~860px): the TOC moves above the content as a **wrapped horizontal row** (`flex flex-wrap gap-x-8 gap-y-5`) with a bottom border, no longer sticky.
- Headings / padding scale down (clamp headings) as in the homepage/About sections.
- No horizontal overflow at 390px; the code block scrolls within its own `overflow-x-auto` container.

## Testing & Scope

- **No unit tests** — a page + presentational/client components only, which the Vitest scope (`src/actions/*`, `src/lib/*`) excludes. The existing suite must still pass.
- Verify: run `npm run lint` and `npm run build` (`/docs` static); in the browser confirm the TOC + all 7 sections render, TOC anchors jump to sections **and the scroll-spy highlights the active section** while scrolling, the callouts / code block / Pro pill render, the "Support" link navigates to `/support`, the mobile layout collapses the TOC to a horizontal row, and there's no horizontal overflow at 390px.
- **Out of scope:** the Support page (separate feature), the other interior pages, real docs content beyond the prototype copy, and per-token code syntax highlighting.
