# Blog Detail Page

## Overview

Flesh out the `/blogs/[slug]` **stub** (`src/app/blogs/[slug]/page.tsx`, currently just a header + "Full article coming soon.") into the real Blog Detail page from `prototypes/homepage/blog-post.html` — article header, a gradient hero panel, the full **prose article body**, an author bio card, and a "Keep reading" related-posts grid. Rebuilt as React server components with Tailwind + the existing marketing primitives; don't copy raw HTML/CSS.

Mirrors the completed **Blog Listing** (`context/features/blog-listing-page-spec.md`) and **About** (`context/features/about-page-spec.md`) features — same `MarketingShell`, `--m-*` tokens, `Reveal`, and `constants.ts` data pattern.

## Route & Auth

- Stays at `src/app/blogs/[slug]/page.tsx`, a **server component** wrapped in the existing `MarketingShell` (`src/components/marketing/MarketingShell.tsx`), which provides `MarketingNav`, `Footer`, the `.marketing` token scope, and the ambient glow.
- **Public**, static — keep the existing `generateStaticParams` (over `BLOG_POSTS`) and `generateMetadata` (title/description from the resolved post), and `notFound()` on an unknown slug. Builds `●` (SSG, one page per slug). No `proxy.ts` matcher change.

## Component Architecture

Server-first. Add new presentational **server components** under `src/components/marketing/`; the only client dependency is the existing `Reveal` (already `"use client"`). Reuse `PostMeta` (header byline) and `BlogCard` (related grid).

| Component | Kind | Notes |
| --- | --- | --- |
| `ArticleHero` | server | The gradient hero panel (`.article__hero`): `~h-[320px]`, `rounded-[14px]`, `border-[var(--m-border)]`, the layered brand/pink radial gradient over `--m-surface-2` (the same background `BlogFeatured`'s media uses). `aria-hidden`. |
| `Prose` | server | Renders the post's markdown `content` with **`react-markdown` + `remark-gfm`** (existing deps, same stack as `MarkdownEditor`). A wrapper `div` styled with Tailwind arbitrary-value child selectors (see [Styling](#styling)). react-markdown renders no raw HTML by default, so the blog copy is safe to render. |
| `AuthorBio` | server | The `.author-bio` card: a larger (54px) brand-gradient avatar chip + `<h4>` name + a dim bio paragraph. Uses `BLOG_AUTHOR` / `BLOG_AUTHOR_BIO` + the existing `initials()` helper. |
| `RelatedPosts` | server | The "Keep reading" section: a left-aligned section head (`<h2>`) + a `grid` of **3** `BlogCard`s for other posts (derive: the first 3 of `BLOG_POSTS` excluding the current slug). |

**Compose in `page.tsx`** — a narrow `mx-auto max-w-[760px]` column, each block wrapped in `Reveal`:
article header (category tag + `<h1>` + authored `PostMeta`, already in the stub) → `ArticleHero` → `Prose` → `AuthorBio` → `RelatedPosts`. Add a small **"← Back to Blog"** link (`next/link` → `/blogs`) above the header for navigation.

## Data

Extend `src/components/marketing/constants.ts`:

- Add **`content: string`** (Markdown) to the `BlogPost` interface and to **every** `BLOG_POSTS` entry.
  - The featured Docker post's body is ported **verbatim** from `blog-post.html` (intro → "Stash it once" + the fenced command block → tag advice + the `<ul>` → "Let AI do the tedious part" → close, including the pull-`blockquote`).
  - The other 6 bodies are **authored fresh to match their own title / excerpt / category** — same voice, but this is invented copy, not from the prototype (which only ships the one article).
- Add **`BLOG_AUTHOR_BIO`** from the prototype: `"Building DevStash — one fast, searchable, AI-enhanced hub for developer knowledge."`
- The page resolves the post via the existing `getBlogPost(slug)`; related posts are derived inline.

> Every post now has `content`, so no "coming soon" fallback remains — but `Prose` should still render nothing (or a graceful line) if `content` is ever empty, so a future content-less post never crashes.

## Links & Buttons

Nav + footer come from `MarketingShell` (already correct: brand → `/`, Sign In → `/sign-in`, Get Started → `/register`, Blog `aria-current`). This page adds only:

| Element | Destination |
| --- | --- |
| "← Back to Blog" | `/blogs` (`next/link`) |
| Each related post card (`BlogCard`) | `/blogs/<slug>` (already built into `BlogCard`) |

## Styling

Tailwind utilities + the `--m-*` marketing tokens (defined in `globals.css`, scoped to `.marketing`). Reuse `Reveal`, the article-header treatment already in the stub, and `BlogFeatured`'s gradient for `ArticleHero`. Port the prototype's article styles (`styles.css`: `.prose`, `.code-block`, `.article__hero`, `.author-bio`) to Tailwind **arbitrary values — no new `globals.css` classes** (matching the About / Blog Listing rebuilds). The `Prose` wrapper carries child-element utilities, e.g.:

- Paragraphs: `[&_p]:mb-4 [&_p]:leading-[1.8] [&_p]:text-[var(--m-text-dim)]`
- Headings: `[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[1.5rem] [&_h2]:font-extrabold`; `[&_h3]` slightly smaller
- Inline code: `[&_code]:rounded [&_code]:bg-[var(--m-surface-2)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]`
- Code blocks: `[&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:border [&_pre]:border-[var(--m-border-2)] [&_pre]:bg-[#0d1117] [&_pre]:p-[18px] [&_pre]:text-[0.84rem]` (+ `[&_pre_code]:bg-transparent [&_pre_code]:p-0` to reset the inline-code chip inside blocks)
- Blockquote: `[&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--m-brand)] [&_blockquote]:bg-[color-mix(in_srgb,var(--m-brand)_8%,transparent)] [&_blockquote]:rounded-r [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-[var(--m-text)]`
- Lists / emphasis / links: `[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2`, `[&_strong]:text-[var(--m-text)]`, `[&_a]:text-[var(--m-brand)]`
- `AuthorBio`: `flex items-center gap-4 rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] p-6`; the avatar is `size-[54px] text-base` (vs `PostMeta`'s 30px).

> **Fidelity note:** fenced code renders as a styled monospace block (`#0d1117`, like the prototype) but without the prototype's per-token span coloring (`tok-fn`/`tok-num`) — an acceptable, cosmetic difference. Per-token syntax highlighting is out of scope.

## Responsive

- Article column: `max-w-[760px]` centered; the header `<h1>` uses `clamp(2rem, 4.5vw, 3rem)` (already in the stub); top padding accounts for the fixed nav (the stub's `pt-[136px]` / `max-[560px]:pt-[112px]`).
- Related grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (reuses `BlogCard`'s sizing).
- `ArticleHero` height and paddings scale down on small screens; **no horizontal overflow at 390px**.

## Testing & Scope

- **No unit tests** — pages + presentational components only, which the Vitest scope (`src/actions/*`, `src/lib/*`) excludes. The existing suite must still pass.
- Verify: `npm run lint` + `npm run build` (`/blogs/[slug]` static, all slugs prerendered); in the browser confirm a post (e.g. `/blogs/stop-re-deriving-that-docker-command`) renders the header + hero + full prose (headings, code block, blockquote, list, inline code) + author bio + 3 related cards; `Reveal` fades sections in on scroll; each related card navigates to its `/blogs/<slug>`; "← Back to Blog" returns to `/blogs`; an unknown slug (`/blogs/nope`) 404s; and there's no horizontal overflow at 390px. Confirm the `/blogs` listing still renders (shared `BlogCard` / `PostMeta` unchanged).
- **Out of scope:** the other interior pages (Docs / Support), a real CMS / MDX pipeline, comments / social sharing, and per-token code syntax highlighting.
