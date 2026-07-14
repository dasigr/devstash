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
