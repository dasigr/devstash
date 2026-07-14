# Blog Listing Page

## Overview

Turn the static prototype `prototypes/homepage/blog.html` into the real Blog Listing page at `/blogs`, replacing the current placeholder (`src/app/blogs/page.tsx`, which renders only `<h1>Blogs</h1>`). Reproduce the prototype's **look and content** — a page header (pill + gradient headline + subtitle), one **featured** post, and a **grid of 6 post cards** (accent media, category tag, title, excerpt, and author/date/read-time meta) — rebuilt as React server components with Tailwind + the existing marketing primitives. Don't copy raw HTML/CSS.

This mirrors the completed **About Page** feature (`context/features/about-page-spec.md`), reusing the same shell, tokens, and `constants.ts` data-array pattern.

## Route & Auth

- Stays at `src/app/blogs/page.tsx`, a **server component** wrapped in the existing `MarketingShell` (`src/components/marketing/MarketingShell.tsx`), which already provides `MarketingNav`, `Footer`, the `.marketing` token scope, and the ambient glow.
- **Public** — no `auth()` redirect and no `proxy.ts` matcher change (it's a marketing page; signed-in users may view it). Builds `○ (Static)` like `/about`.
- `metadata`: change `title` from `"Blogs"` to **`"Blog"`**; add the `description` from the prototype `<head>` ("Workflows, tips, and product updates from the DevStash team — on organizing snippets, prompts, commands, and everything developers stash.").

The Footer already links **Blog → `/blogs`**, so no nav/footer wiring changes.

## Component Architecture

Server-first. The page and all card components are **server components** (pure presentational links) — the only interactivity on the page is scroll-reveal and the nav, which already live in existing client components (`Reveal`, `MarketingNav`). Place new components under `src/components/marketing/`.

| Component | Kind | Notes |
| --- | --- | --- |
| `BlogFeatured` | server | Large 2-col featured card: a gradient media panel (left) + body (right) with a category tag, `<h3>` title, excerpt, and `PostMeta`. Wraps in a `next/link` to `/blogs/<slug>` with `aria-label="Read: <title>"`. Stacks to 1 col on mobile. |
| `BlogCard` | server | Grid card: an accent media block (tinted via inline `--c`, like `FeatureCard`), a category tag colored by `--c`, `<h3>` title, excerpt, and `PostMeta`. Wraps in a `next/link` to `/blogs/<slug>`. |
| `PostMeta` | server (small, shared) | Avatar initials chip (brand gradient) + optional author name (shown on the featured card only) + dot-separated date + read time. Reused by `BlogFeatured`, `BlogCard`, and the detail stub. Props: `{ author?; date; readTime; initials }`. |

**Compose in `page.tsx`:** page-header section (reuse About's pill + gradient-`<h1>` + subtitle pattern, in `Reveal`) → featured (`Reveal` + `BlogFeatured`) → post grid (each cell `Reveal` + `BlogCard`).

## Data

Add to `src/components/marketing/constants.ts`, following the existing `FEATURES` / `ABOUT_*` pattern (accents reference `--m-*` tokens, never hardcoded hexes):

```ts
export interface BlogPost {
  slug: string;      // kebab-case, derived from the title
  title: string;
  excerpt: string;
  category: string;  // e.g. "AI", "Snippets", "Featured · Workflows"
  accent: string;    // var(--m-*)
  author: string;    // "Romualdo Dasig"
  date: string;      // "Jul 10, 2026"
  readTime: string;  // "6 min read"
  featured?: boolean;
}

export const BLOG_POSTS: BlogPost[] = [ /* 1 featured + 6 grid entries */ ];

export function getBlogPost(slug: string): BlogPost | undefined { … }
```

- Copy the **7 posts verbatim** from the prototype (titles, excerpts, categories, dates, read-times). Author "Romualdo Dasig" / initials "RD" (add an `AUTHOR_INITIALS`/derive helper, or a small `initials()` util).
- Accents map 1:1 from the prototype's `--c-*` to `--m-*` (command→`--m-command`, prompt→`--m-prompt`, snippet→`--m-snippet`, url→`--m-url`, note→`--m-note`, image→`--m-image`).
- The page derives `featured = BLOG_POSTS.find((p) => p.featured)` and `rest = BLOG_POSTS.filter((p) => !p.featured)`.

## Links & Buttons

Nav + footer come from `MarketingShell` (already correct: brand → `/`, Sign In → `/sign-in`, Get Started → `/register`). This page adds only:

| Element | Destination |
| --- | --- |
| Each post card / featured card | `/blogs/<slug>` (`next/link`, href built from the post's `slug`) |

## Blog detail route (stub)

So the post links resolve, add **`src/app/blogs/[slug]/page.tsx`** as a minimal **stub** server component:

- Wrapped in `MarketingShell`, public, static via **`generateStaticParams`** over `BLOG_POSTS`.
- Resolves the slug with `getBlogPost`; **`notFound()`** on an unknown slug.
- Renders a centered article header (category tag, `<h1>` title, `PostMeta` with author) + a short **"Full article coming soon."** placeholder body (reusing `PostMeta`).
- **`generateMetadata`** sets `title`/`description` from the resolved post.

> The full `blog-post.html` article conversion (prose body, author bio, related posts) is **explicitly a separate future feature** — this stub exists only so the listing's links don't dead-end.

## Styling

Tailwind utilities + the `--m-*` marketing tokens (already defined in `globals.css`, scoped to `.marketing`). Reuse `Reveal`, the pill + gradient-text patterns from `Hero`/About, and the per-card `--c` inline-var trick from `FeatureCard`. Port the prototype's blog styles (`styles.css:790–872`) to Tailwind **arbitrary values** — no new `globals.css` classes:

- **Featured** (`.blog-featured`): `grid lg:grid-cols-[1.1fr_1fr]` → 1 col on mobile; `--m-surface` card, `--m-border`, `rounded-[14px]`, `overflow-hidden`, hover lift (`hover:-translate-y-[3px]` + border/shadow). Media panel = layered radial brand/pink gradients over `--m-surface-2`, `min-h-[260px]` (→ `min-h-[180px]` mobile). Body `p-8`, `h3` ~`1.7rem`.
- **Card** (`.post-card`): `flex flex-col` `--m-surface` card, hover lift (`hover:-translate-y-1` + shadow). Media `h-[150px]` = `color-mix` radial of `--c` over `--m-surface-2`. Category tag = `text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[var(--c)]`. Excerpt `flex-1 text-[var(--m-text-dim)]`.
- **Meta** (`.post-meta` / `.avatar`): 30px avatar, `linear-gradient(135deg,var(--m-brand),var(--m-brand-2))`, white initials; `text-[0.82rem] text-[var(--m-text-mute)]`; 3px dot separators between date/read-time.
- **Page header**: reuse About's treatment (pill, `clamp(...)` gradient `<h1>` "Stash smarter, `<span>`ship faster`</span>`", dim subtitle).

## Responsive

- Post grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (prototype: 3 → 2 → 1).
- Featured: 2 col → 1 col under `lg` (media on top).
- Page header / padding scale down (clamp headings, reduce padding) as in the homepage/About sections.

## Testing & Scope

- **No unit tests** — pages + presentational components only, which the Vitest scope (`src/actions/*`, `src/lib/*`) excludes. The existing suite must still pass.
- Verify: run `npm run lint` and `npm run build` (`/blogs` and `/blogs/[slug]` static); in the browser confirm `/blogs` renders the header + featured + 6-card grid, `Reveal` fades in on scroll, each post/featured link navigates to its `/blogs/<slug>` stub (which renders the header + "coming soon" placeholder), an unknown slug (`/blogs/nope`) 404s, the mobile layout collapses correctly, and there's no horizontal overflow at 390px.
- **Out of scope:** the full blog-detail article body (prose / author bio / related posts — a future feature), the other interior pages (Docs/Support), and real CMS content beyond the prototype copy.
