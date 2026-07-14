import {
  Code,
  Search,
  Sparkles,
  Terminal,
  FileText,
  Layers,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Data arrays that drive the marketing homepage's repeated cards. Accent colors
 * reference the marketing palette tokens (`--m-*`, defined in globals.css) — the
 * per-card `--c` is set to one of these so a card's markup never hardcodes a hex.
 */

export interface MarketingFeature {
  title: string;
  description: string;
  icon: LucideIcon;
  /** CSS var reference into the marketing accent palette. */
  accent: string;
}

export const FEATURES: MarketingFeature[] = [
  {
    title: "Code Snippets",
    description:
      "Syntax-highlighted, language-aware, copy in one click. Your reusable code, always at hand.",
    icon: Code,
    accent: "var(--m-snippet)",
  },
  {
    title: "AI Prompts",
    description:
      "Save the prompts that work. Version them, tag them, and pull the right one in seconds.",
    icon: Sparkles,
    accent: "var(--m-prompt)",
  },
  {
    title: "Instant Search",
    description:
      "Search across content, titles, tags, and types. A ⌘K palette that jumps to anything.",
    icon: Search,
    accent: "var(--m-url)",
  },
  {
    title: "Commands",
    description:
      "Stop re-deriving that Docker or git incantation. Stash it once, run it forever.",
    icon: Terminal,
    accent: "var(--m-command)",
  },
  {
    title: "Files & Docs",
    description:
      "Upload context files, images, and docs. Keep them beside the code they belong to.",
    icon: FileText,
    accent: "var(--m-file)",
  },
  {
    title: "Collections",
    description:
      "Group anything into collections — React Patterns, Interview Prep — an item can live in many.",
    icon: Layers,
    accent: "var(--m-note)",
  },
];

/** Mini dashboard-preview sidebar rows (label + accent). */
export const PREVIEW_NAV: { label: string; accent: string }[] = [
  { label: "Snippets", accent: "var(--m-snippet)" },
  { label: "Prompts", accent: "var(--m-prompt)" },
  { label: "Commands", accent: "var(--m-command)" },
  { label: "Notes", accent: "var(--m-note)" },
  { label: "Links", accent: "var(--m-url)" },
];

/** Accent per mini card in the dashboard-preview grid (12 cards). */
export const PREVIEW_CARDS: string[] = [
  "var(--m-snippet)",
  "var(--m-prompt)",
  "var(--m-command)",
  "var(--m-note)",
  "var(--m-url)",
  "var(--m-image)",
  "var(--m-snippet)",
  "var(--m-prompt)",
  "var(--m-command)",
  "var(--m-note)",
  "var(--m-url)",
  "var(--m-image)",
];

export type BillingPeriod = "monthly" | "yearly";

export interface PlanPrice {
  amount: string;
  per: string;
  tag: string;
}

export interface PricingPlan {
  name: string;
  featured: boolean;
  badge?: string;
  /** Per-period price. Free is identical across periods. */
  price: Record<BillingPeriod, PlanPrice>;
  features: string[];
  cta: { label: string; href: string; variant: "primary" | "outline" };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    featured: false,
    price: {
      monthly: { amount: "$0", per: "/forever", tag: "For getting organized." },
      yearly: { amount: "$0", per: "/forever", tag: "For getting organized." },
    },
    features: [
      "Up to 50 items",
      "3 collections",
      "All text & link types",
      "Basic search",
      "Dark mode",
    ],
    cta: { label: "Get Started", href: "/register", variant: "outline" },
  },
  {
    name: "Pro",
    featured: true,
    badge: "Most Popular",
    price: {
      monthly: { amount: "$8", per: "/month", tag: "Billed monthly." },
      yearly: { amount: "$6", per: "/month", tag: "$72 billed yearly." },
    },
    features: [
      "Unlimited items",
      "Unlimited collections",
      "File & image uploads",
      "Full search",
      "AI auto-tag, summaries & explain",
      "Prompt optimizer",
      "Export (JSON / ZIP)",
    ],
    cta: { label: "Go Pro", href: "/register", variant: "primary" },
  },
];

/** AI section checklist copy. */
export const AI_CHECKLIST: string[] = [
  "Auto-tag suggestions the moment you paste",
  "One-line summaries for long notes",
  "“Explain this code” on any snippet",
  "Prompt optimizer that sharpens your prompts",
];

/** AI "Generated Tags" demo chips. */
export const AI_TAGS: string[] = [
  "react",
  "hooks",
  "typescript",
  "debounce",
  "performance",
];

/** Footer link columns. Non-page links point at `#` placeholders. */
export const FOOTER_COLUMNS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blogs" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Support", href: "/support" },
    ],
  },
];

/** About page stat cards (gradient number + dim label). */
export const ABOUT_STATS: { num: string; label: string }[] = [
  { num: "7", label: "Built-in item types" },
  { num: "1", label: "Search for everything" },
  { num: "∞", label: "Collections on Pro" },
  { num: "0", label: "Context switching" },
];

/** About "What we optimize for" cards — icons included. */
export const ABOUT_VALUES: MarketingFeature[] = [
  {
    title: "Fast",
    description:
      "Quick to create, quick to open. A ⌘K palette that jumps to anything without breaking flow.",
    icon: Zap,
    accent: "var(--m-snippet)",
  },
  {
    title: "Searchable",
    description:
      "Search across content, titles, tags, and types. If you stashed it, you can find it.",
    icon: Search,
    accent: "var(--m-command)",
  },
  {
    title: "AI-enhanced",
    description:
      "Auto-tags, summaries, code explanations, and a prompt optimizer — right where you work.",
    icon: Sparkles,
    accent: "var(--m-prompt)",
  },
  {
    title: "Developer-first",
    description:
      "Dark mode by default, syntax highlighting, markdown, and keyboard-driven from end to end.",
    icon: Code,
    accent: "var(--m-note)",
  },
];

/** Author byline shared across every blog post. */
export const BLOG_AUTHOR = "Romualdo Dasig";

/** Author bio line shown in the blog detail page's author card. */
export const BLOG_AUTHOR_BIO =
  "Building DevStash — one fast, searchable, AI-enhanced hub for developer knowledge.";

/** Derive up-to-two-letter initials from a name ("Romualdo Dasig" → "RD"). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

export interface BlogPost {
  /** kebab-case, used in the `/blogs/<slug>` route. */
  slug: string;
  title: string;
  excerpt: string;
  /** e.g. "AI", "Snippets", "Featured · Workflows". */
  category: string;
  /** CSS var reference into the marketing accent palette (`var(--m-*)`). */
  accent: string;
  author: string;
  date: string;
  readTime: string;
  /** Full article body as Markdown (rendered via react-markdown + remark-gfm). */
  content: string;
  featured?: boolean;
}

/** Blog listing posts (1 featured + 6 grid), copied verbatim from the prototype. */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "stop-re-deriving-that-docker-command",
    title: "Stop re-deriving that Docker command for the fifth time",
    excerpt:
      "The commands you run once a month are the ones you never remember. Here's a system for stashing them so they're one search away — forever.",
    category: "Featured · Workflows",
    accent: "var(--m-command)",
    author: BLOG_AUTHOR,
    date: "Jul 10, 2026",
    readTime: "6 min read",
    content: `You know the one. The \`docker\` flag combination you looked up three months ago, got working, and then promptly forgot. Now you're back in the docs, back in Stack Overflow, back in your shell history running \`Ctrl-R\` and hoping past-you typed it recently enough.

The commands you run **once a month** are exactly the ones you never remember — too rare to memorize, too important to lose. That's the gap DevStash's Command type is built for.

## Stash it once

When you finally get a command working, don't just move on. Save it as a Command item with a clear title and a tag or two. Future-you will search for it by intent, not by exact syntax.

\`\`\`
docker system prune -af --volumes
docker compose down --remove-orphans
docker image ls --filter "dangling=true" -q | xargs docker rmi
\`\`\`

Give it a title like *"Prune Docker system (reclaim disk)"* and tags like \`docker\`, \`cleanup\`. Now it's one ⌘K search away.

> A command you can't find in five seconds is a command you'll re-derive from scratch. The point of stashing is retrieval, not hoarding.

## Tag for how you'll search, not how you filed it

The mistake most people make with snippet managers is organizing by where things came from. Organize by **what you'll be thinking** when you need it again:

- Tag by the problem it solves (\`cleanup\`, \`debug\`, \`deploy\`).
- Tag by the tool (\`docker\`, \`git\`, \`kubectl\`).
- Drop it into a collection like *DevOps* so related commands live together.

### Let AI do the tedious part

On Pro, paste the command and let auto-tagging suggest the tags for you — then accept the ones that fit. It's the difference between a stash you keep up and one you abandon after a week.

That's the whole system: capture the moment it works, tag for retrieval, and trust search to do the rest. Do it for a month and you'll never re-derive that Docker command again.`,
    featured: true,
  },
  {
    slug: "a-prompt-library-that-actually-pays-off",
    title: "A prompt library that actually pays off",
    excerpt:
      "Version the prompts that work, tag them, and pull the right one in seconds instead of scrolling chat history.",
    category: "AI",
    accent: "var(--m-prompt)",
    author: BLOG_AUTHOR,
    date: "Jul 6, 2026",
    readTime: "5 min read",
    content: `Every developer working with AI ends up with the same problem: the prompt that got a great result is buried somewhere in a chat history you'll never scroll back to. You rewrite it from memory, get a worse answer, and start tweaking all over again.

A prompt is a piece of engineering. It deserves the same treatment as a snippet — a home, a name, and a way to find it again.

## Save the ones that work

The moment a prompt produces something you'd reuse, stash it as a Prompt item. Give it a descriptive title (\`Senior code reviewer\`, \`Explain a stack trace\`) so you're searching by *what it does*, not by the first few words you happened to type.

- Tag by task — \`review\`, \`refactor\`, \`docs\`, \`tests\`.
- Tag by model if the phrasing is model-specific.
- Group a set into a collection like *AI Workflows*.

## Version, don't overwrite

When you improve a prompt, keep the change deliberate. Small edits compound — a sharper role, a tighter constraint, one good example — and the difference between an okay prompt and a great one is usually a single line.

> The best prompt library isn't the biggest. It's the one where the ten prompts you actually use are one search away.

## Let the optimizer help

On Pro, the prompt optimizer rewrites a rough prompt into a sharper one — clearer role, explicit output format, fewer ways to go wrong. Start from its version, keep what fits, and stash the result.`,
  },
  {
    slug: "organizing-snippets-with-collections",
    title: "Organizing snippets with collections",
    excerpt:
      "One snippet can live in React Patterns and Interview Prep at once. Here's how to structure collections that scale.",
    category: "Snippets",
    accent: "var(--m-snippet)",
    author: BLOG_AUTHOR,
    date: "Jul 2, 2026",
    readTime: "4 min read",
    content: `Folders force a choice: a snippet lives in one place, so you file it under *React* and then can't find it three weeks later when you're thinking *Interview Prep*. The thing you saved is real; the single location you filed it under was a guess.

Collections drop the constraint. An item can belong to **as many collections as make sense**, so you organize around how you'll look for something rather than where it came from.

## One snippet, many homes

A well-written \`useDebounce\` hook is a React pattern, an interview talking point, and a performance trick all at once. Put it in all three collections and it surfaces wherever your head is at that moment.

## Structure that scales

- Keep collections **intent-shaped** — *React Patterns*, *Interview Prep*, *DevOps* — not source-shaped.
- Let items overlap freely; overlap is the feature, not a mess to clean up.
- Lean on search for the long tail and collections for the handful you revisit constantly.

> Collections are for the things you return to on purpose. Search is for everything else. You need both.

Start with three or four collections you'd actually open. Add items as you go, drop them into whatever fits, and let the structure grow out of real use instead of a taxonomy you designed up front.`,
  },
  {
    slug: "finding-anything-with-the-command-palette",
    title: "Finding anything with the ⌘K palette",
    excerpt:
      "Search across content, titles, tags, and types. A tour of the command palette and the tricks that make it fast.",
    category: "Search",
    accent: "var(--m-url)",
    author: BLOG_AUTHOR,
    date: "Jun 27, 2026",
    readTime: "3 min read",
    content: `The fastest way to open anything in DevStash isn't a click — it's \`⌘K\`. The command palette is the front door to your whole stash: items, collections, every type, all from the keyboard.

## Search across everything

The palette matches on **content, titles, tags, and types** at once. Half-remember a snippet but know it mentioned \`AbortController\`? Type it. Only recall you tagged something \`deploy\`? That works too. You don't have to know where a thing lives to find it.

## Tricks that make it fast

- Search by **intent** — the words you'd think, not the exact title.
- Lean on **tags** as a fuzzy filter when the title escapes you.
- Hit \`⌘K\`, type a few letters, and press Enter — the top result is usually the one you meant.

> If it takes longer to find a snippet than to rewrite it, the tool has failed. The palette exists so retrieval always wins.

Give it a week and the palette becomes muscle memory. You stop *browsing* for things and start *summoning* them.`,
  },
  {
    slug: "markdown-notes-done-right",
    title: "Markdown notes, done right",
    excerpt:
      "A write/preview editor for notes and prompts, with GFM support and syntax-highlighted code blocks.",
    category: "Product",
    accent: "var(--m-note)",
    author: BLOG_AUTHOR,
    date: "Jun 21, 2026",
    readTime: "4 min read",
    content: `A note you can't format is a note you won't reread. Walls of plain text hide the one line you needed. DevStash's Note and Prompt types use a real Markdown editor — a **write/preview** surface, so you draft in Markdown and see exactly how it'll render.

## GFM, where it counts

The editor supports GitHub-Flavored Markdown — the parts developers actually use:

- Headings to break a note into sections you can skim.
- Lists and task lists for steps and checklists.
- Tables for the small comparisons that don't deserve a spreadsheet.
- Inline \`code\` and fenced blocks with syntax highlighting.

## Preview before you trust it

Toggle to **Preview** and you're seeing the same render the detail drawer shows later — no surprises, no broken tables discovered a month after you wrote them.

> Formatting isn't decoration. It's the difference between a note you scan in five seconds and one you skip because it's a wall of text.

Write it once, format it so future-you can skim it, and it stays useful long after you've forgotten the details.`,
  },
  {
    slug: "keep-files-beside-the-code",
    title: "Keep files beside the code they belong to",
    excerpt:
      "Upload context files, images, and docs, and stash them right next to the snippets and prompts that use them.",
    category: "Pro",
    accent: "var(--m-image)",
    author: BLOG_AUTHOR,
    date: "Jun 15, 2026",
    readTime: "5 min read",
    content: `Some knowledge doesn't fit in a text box. A design mockup, an architecture diagram, a sample payload, a PDF spec — they end up in Downloads, a Slack thread, or a folder you'll never open again, drifting away from the code they explain.

On Pro, File and Image items keep them **beside the code they belong to**.

## Context that travels with the code

Upload a context file, an image, or a doc and stash it right next to the snippet or prompt that uses it. When you open the item later, the reference is *there* — not two apps away.

- Attach the sample \`response.json\` next to the parser that consumes it.
- Keep the schema diagram in the same collection as the queries.
- Drop the design export beside the component that implements it.

> The best place to store a file is next to the thing it explains. Everywhere else, it's just clutter you'll lose.

Files are a Pro type, and they upload straight into the same searchable, collection-aware home as everything else — so context stops scattering the moment you stash it.`,
  },
  {
    slug: "from-bash-history-to-a-real-command-stash",
    title: "From bash history to a real command stash",
    excerpt:
      "Your shell history is a graveyard. Promote the commands worth keeping into a searchable, taggable home.",
    category: "Workflows",
    accent: "var(--m-command)",
    author: BLOG_AUTHOR,
    date: "Jun 9, 2026",
    readTime: "6 min read",
    content: `Your shell history is a graveyard. Ten thousand lines deep, unsearchable in practice, and the good commands are buried under a thousand \`cd\`s and \`ls\`s. \`Ctrl-R\` is archaeology, not retrieval.

The commands worth keeping deserve to be **promoted** — pulled out of history into a searchable, taggable home before they scroll off the end forever.

## Mine your history

Start where the good ones already are:

\`\`\`
history | awk '{$1=""; print}' | sort | uniq -c | sort -rn | head -40
\`\`\`

That surfaces your most-run commands. Most are noise — but a few are the exact incantations you'd hate to reconstruct. Those are the keepers.

## Promote, don't hoard

- Save each keeper as a **Command** item with a title that says what it *does*.
- Tag for retrieval — the tool and the problem, not the syntax.
- Drop related commands into a collection like *DevOps* or *Git*.

> History remembers everything and surfaces nothing. A stash remembers only what you chose — and hands it back in five seconds.

Do this once and your best commands stop depending on how recently you ran them. They're not in a graveyard anymore; they're in a home you can search.`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/** About "Who it's for" cards — no icon tile. */
export const ABOUT_AUDIENCES: {
  title: string;
  description: string;
  accent: string;
}[] = [
  {
    title: "The everyday developer",
    description:
      "A fast way to grab snippets, prompts, commands, and links without leaving your flow.",
    accent: "var(--m-snippet)",
  },
  {
    title: "The AI-first developer",
    description:
      "Save prompts, contexts, workflows, and system messages — versioned and searchable.",
    accent: "var(--m-prompt)",
  },
  {
    title: "The content creator",
    description:
      "Store code blocks, explanations, and course notes in one organized, reusable place.",
    accent: "var(--m-note)",
  },
  {
    title: "The full-stack builder",
    description:
      "Collect patterns, boilerplates, and API examples into collections you actually revisit.",
    accent: "var(--m-url)",
  },
];
