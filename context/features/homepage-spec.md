# Homepage

## Overview

Turn the static prototype in `prototypes/homepage/` (`index.html` / `styles.css` / `script.js`) into the real app homepage at the root route `/` (currently a placeholder `<h1>DevStash</h1>`). This is the public marketing landing page: a "chaos → order" hero, feature grid, AI/Pro section, pricing, CTA, and footer.

Reproduce the prototype's **look and behavior** — don't copy its raw HTML/CSS/JS. Rebuild it as React server/client components using Tailwind + the existing ShadCN primitives, matching the rest of the codebase.

## Route & Auth

- Lives at `src/app/page.tsx` — a **server component**, rendered **outside** the dashboard shell (no `Sidebar`/`TopBar`).
- Public: not added to the `proxy.ts` matcher.
- If a session exists (`auth()`), **redirect to `/dashboard`** so signed-in users skip the marketing page. (The homepage is for logged-out visitors.)
- Set page `metadata` (title + description) from the prototype's `<head>`.

## Component Architecture

Server-first. Only the pieces that need interactivity are `"use client"`. Place components under `src/components/marketing/` (per the `src/components/[feature]/` convention).

| Component | Kind | Notes |
| --- | --- | --- |
| `page.tsx` | server | Assembles the sections; handles the signed-in redirect. |
| `MarketingNav` | **client** | Fixed nav; adds a blurred/opaque background on scroll; mobile hamburger toggles the actions. |
| `Hero` | server | Hero text + CTAs + the showcase layout. |
| `ChaosField` | **client** | The floating-icons animation (see Interactivity). |
| `DashboardPreview` | server | Static mock sidebar + item-card grid (colored top borders). Pure markup. |
| `FeatureGrid` | server | 6 feature cards, each tinted by its accent color. |
| `AiSection` | server | Pro badge, checklist, and the static code-editor + "AI Generated Tags" mockup. |
| `Pricing` | **client** | Free vs Pro cards + monthly/yearly billing toggle (price is state-driven). |
| `Reveal` | **client** | Small wrapper that fades children in on scroll via `IntersectionObserver`; no-op fallback shows content immediately. Reused across sections. |
| `Footer` | server | Link columns + copyright; render the year with `new Date().getFullYear()`. |

Keep it DRY: one `Reveal` wrapper, one shared feature-card and price-card component driven by data arrays (map over a `FEATURES` / `PRICING_PLANS` array rather than hand-writing each card).

## Sections

Follow the prototype markup section-for-section: Nav → Hero (chaos / arrow / dashboard preview) → Features (6 cards) → AI/Pro → Pricing (Free + Pro) → CTA band → Footer.

## Links & Buttons

Wire every link/button to a real destination using `next/link`. In-page anchors keep smooth-scroll to section ids.

| Element | Destination |
| --- | --- |
| Brand logo | `/` |
| Nav "Sign In" | `/sign-in` |
| Nav "Get Started" | `/register` |
| Nav "Features" / "Pricing" | `#features` / `#pricing` |
| Hero "Start stashing — free" | `/register` |
| Hero "See how it works" | `#features` |
| AI "Unlock AI features" | `#pricing` |
| Pricing Free "Get Started" | `/register` |
| Pricing Pro "Go Pro" | `/register` (billing/Stripe is out of scope) |
| CTA "Start stashing — free" | `/register` |
| Footer "Features" / "Pricing" | `#features` / `#pricing` |
| Footer Changelog / About / Blog / Careers / Docs / Support / Community | `#` placeholders (no pages yet) |

## Styling

- Tailwind utilities + existing theme tokens; dark theme (the app is already `dark` by default on `<html>`).
- The prototype uses its **own marketing accent palette** (Snippet `#3b82f6`, Prompt `#f59e0b`, Command `#06b6d4`, Note `#22c55e`, File `#64748b`, Image `#ec4899`, URL `#6366f1`). These **differ** from the live app's item-type colors — follow the prototype's palette for this page. Define them once (CSS custom properties in `globals.css` or a shared constants map) and reference them; don't hardcode hexes per card.
- Reuse the ShadCN `Button` (via `asChild` wrapping `Link`) for CTAs where it maps cleanly; the marketing button looks (primary / ghost / outline / lg / block) can extend `buttonVariants` or use utility classes — keep variants minimal and shared.
- Reuse the existing `Logo` brand mark for the nav/footer.
- Preserve the visual details: gradient hero headline, pills/badges, feature-card hover glow, code-editor window dots, mini-dashboard colored top borders.

## Interactivity (client behavior)

Port `script.js` behavior into the relevant client components:

- **ChaosField** — `requestAnimationFrame` physics: 8 icons drift, bounce off walls, subtle rotation + scale pulse, and repel from the cursor. Handle window resize (re-measure, clamp positions). Icons are **inline SVGs** — lucide dropped brand icons, so Notion/GitHub/Slack/VS Code (and the terminal/tabs/file/bookmark) come from inline SVG markup. Clean up the rAF loop on unmount.
- **MarketingNav** — passive scroll listener toggles the scrolled background; hamburger toggles the mobile menu with correct `aria-expanded`.
- **Pricing** — monthly/yearly toggle swaps the Pro price ($8/mo ↔ $6/mo, "$72 billed yearly") and updates `aria-pressed`.
- **Reveal** — `IntersectionObserver` fade-in; if unsupported, show immediately.
- **Reduced motion** — respect `prefers-reduced-motion`: place the chaos icons statically (no loop), disable the arrow pulse, and reveal content immediately.

## Responsive

- Chaos / arrow / dashboard-preview **stack vertically** on mobile; the transform arrow rotates 90° to point down.
- Feature, pricing, and footer grids collapse to fewer columns.
- Desktop nav links/actions swap for the hamburger dropdown.

## Testing & Scope

- **No unit tests** — this feature adds only components and a page, which the Vitest scope (`src/actions/*`, `src/lib/*`) deliberately excludes. The existing suite must still pass.
- Verify in the browser: all links resolve, animations run, reduced-motion path, mobile layout, and the signed-in → `/dashboard` redirect. Run `npm run lint` and `npm run build`.
- **Out of scope:** real billing/Stripe wiring, the placeholder footer pages (Changelog/About/etc.), and any changes to the dashboard or auth flows.
```
