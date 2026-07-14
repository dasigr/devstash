# About Page

## Overview

Turn the static prototype `prototypes/homepage/about.html` into the real About page at `/about`, replacing the current placeholder (`src/app/about/page.tsx`, which renders only `<h1>About</h1>`). Reproduce the prototype's **look and content** — page header, mission prose, a stats row, two card grids ("What we optimize for" / "Who it's for"), and a CTA band — rebuilt as React server components with Tailwind + the existing marketing primitives. Don't copy raw HTML/CSS.

## Route & Auth

- Stays at `src/app/about/page.tsx`, a **server component** wrapped in the existing `MarketingShell` (`src/components/marketing/MarketingShell.tsx`), which already provides `MarketingNav`, `Footer`, the `.marketing` token scope, and the ambient glow.
- **Public** — no `auth()` redirect and no `proxy.ts` matcher change (it's a marketing page; unlike the homepage, signed-in users may view it).
- `metadata`: keep `title: "About"`; add the `description` from the prototype `<head>` ("Why we built DevStash: one fast, searchable, AI-enhanced hub for all the developer knowledge that scatters across your tools.").

## Component Architecture

Server-first. Reuse existing marketing components; the only client dependency is `Reveal` (already `"use client"`). Place new components under `src/components/marketing/`.

**Shared extractions (DRY — reused by the homepage too):**

| Component | Kind | Notes |
| --- | --- | --- |
| `CtaBand` | server | Extract the CTA band currently **inline** in `src/app/page.tsx` (heading + sub + `marketingButton` CTA, wrapped in `Reveal`). Props for `title` / `subtitle` / CTA `label`+`href`. Refactor the homepage to render `<CtaBand …>`; About reuses it with the same copy ("Ready to Organize Your Knowledge?" / "Everything you know as a developer, in one fast, searchable home." / "Start stashing — free" → `/register`). |
| `FeatureCard` | server | Extract the tinted card markup currently inline in `FeatureGrid.tsx` into a presentational component: props `{ title, description, accent, icon? }`, `icon` **optional** (renders the icon tile only when present — the About "Who it's for" grid has no icons). Refactor `FeatureGrid` to map onto it; About's two grids reuse it. Keep the existing hover/glow/top-bar classes. |

**About page sections** (composed in `page.tsx`, or as small local section components if cleaner — no client needed):

| Section | Source | Notes |
| --- | --- | --- |
| Page header | `.page-header` | `pill` ("Our story") + gradient `<h1>` ("Built for developers who *lose things*", second line gradient) + dim subtitle. Reuse the pill + gradient-text patterns from `Hero`. Wrap in `Reveal`. |
| Mission | `.about-mission .prose` | Narrow (`max-w-[760px]`) prose block: `<h2>`, paragraphs with inline `<code>`/`<strong>`, and a brand-accent left-border `<blockquote>`. Port the prototype `.prose` rules to Tailwind. |
| Stats row | `.stats-row` | 4 `stat-card`s (gradient number + dim label) from `ABOUT_STATS`. Grid: 4 cols → 2 cols on mobile. |
| What we optimize for | `.section__head` + `.feature-grid` | Section head (h2 + sub) + 4 `FeatureCard`s **with icons**, from `ABOUT_VALUES`. |
| Who it's for | `.section__head` + `.feature-grid` | Section head + 4 `FeatureCard`s **without icons**, from `ABOUT_AUDIENCES`. |
| CTA band | `.cta-band` | Reuse the extracted `CtaBand`. |

**Data arrays** (add to `src/components/marketing/constants.ts`, following the existing `FEATURES` pattern; accents reference `--m-*` tokens, never hardcoded hexes):

- `ABOUT_STATS: { num: string; label: string }[]` — `7 / Built-in item types`, `1 / Search for everything`, `∞ / Collections on Pro`, `0 / Context switching`.
- `ABOUT_VALUES: MarketingFeature[]` (reuses the existing `MarketingFeature` type, so it has an `icon`) — Fast (`--m-snippet`), Searchable (`--m-command`), AI-enhanced (`--m-prompt`), Developer-first (`--m-note`). Use lucide icons (e.g. `Zap`, `Search`, `Sparkles`, `Code`).
- `ABOUT_AUDIENCES: { title: string; description: string; accent: string }[]` (no icon) — everyday developer (`--m-snippet`), AI-first developer (`--m-prompt`), content creator (`--m-note`), full-stack builder (`--m-url`).

## Links & Buttons

Nav + footer links come from `MarketingShell` / `MarketingNav` / `Footer` (already correct: brand → `/`, Sign In → `/sign-in`, Get Started → `/register`, About `aria-current`, Features/Pricing → `/#features` / `/#pricing`, Blog/Docs/Support → `/blogs` / `/docs` / `/support`). This page adds only:

| Element | Destination |
| --- | --- |
| CTA "Start stashing — free" | `/register` (via `marketingButton` on a `next/link`) |

## Styling

- Tailwind utilities + the `--m-*` marketing tokens (already defined in `globals.css`, scoped to `.marketing`). Reuse `Reveal`, `marketingButton`, the pill + gradient-text patterns from `Hero`, and the `FeatureCard` grid classes from `FeatureGrid`.
- Port the prototype's About-only styles to Tailwind arbitrary values: `.prose` (dim text, relaxed line-height, spaced children, brand links, `<blockquote>` = 3px `--m-brand` left border + faint brand bg + `rounded-r`, inline `<code>` = `--m-surface-2` chip), `.stat-card` (surface card, gradient number `--m-brand`→`--m-brand-2`, dim label), `.section__head` (centered, `max-w-[640px]`).
- No new `globals.css` classes unless a rule is impractical inline (prefer arbitrary-value utilities to match the homepage rebuild).

## Responsive

- Stats row: 4 cols → 2 cols under ~720px.
- Feature grids: 3 → 2 → 1 col (reuse `FeatureGrid`'s existing responsive classes via `FeatureCard`).
- Page header / prose / CTA scale down (clamp headings, reduce padding) as in the homepage sections.

## Testing & Scope

- **No unit tests** — components + a page only, which the Vitest scope (`src/actions/*`, `src/lib/*`) excludes. The existing suite must still pass.
- Verify: run `npm run lint` and `npm run build`; in the browser confirm `/about` renders all sections, `Reveal` fades in on scroll, the CTA links to `/register`, mobile layout collapses correctly, and the **homepage still renders identically** after the `CtaBand` / `FeatureCard` refactor.
- **Out of scope:** the other interior pages (Blog/Docs/Support), any auth/dashboard changes, and real content beyond the prototype copy.
