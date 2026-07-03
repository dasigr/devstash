/**
 * Mock data — single source of truth for the dashboard UI until the database
 * is wired up. Shapes loosely follow the Prisma schema in
 * `context/project-overview.md`. Purely for display; no helpers.
 */

export type ContentType = "TEXT" | "FILE" | "URL";

export interface ItemType {
  id: string;
  /** System type key, matches the route slug (e.g. "snippets"). */
  slug: string;
  name: string;
  contentType: ContentType;
  route: string;
  color: string;
  /** lucide-react icon name. */
  icon: string;
  isPro: boolean;
  /** Count shown next to the sidebar link. */
  count: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  /** ItemType ids the collection holds, most common first. */
  itemTypeIds: string[];
}

export interface Item {
  id: string;
  title: string;
  /** ItemType id this item belongs to. */
  itemTypeId: string;
  /** Text content, url, or file description depending on the type. */
  preview: string;
  language?: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  /** Human-friendly relative time, as shown in the dashboard cards. */
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  isPro: boolean;
}

export const currentUser: User = {
  id: "user_1",
  name: "Juan Dela Cruz",
  email: "juandela.cruz@a5project.com",
  avatarInitials: "JC",
  isPro: true,
};

export const itemTypes: ItemType[] = [
  {
    id: "type_snippet",
    slug: "snippets",
    name: "Snippets",
    contentType: "TEXT",
    route: "/items/snippets",
    color: "#3b82f6",
    icon: "Code",
    isPro: false,
    count: 42,
  },
  {
    id: "type_prompt",
    slug: "prompts",
    name: "Prompts",
    contentType: "TEXT",
    route: "/items/prompts",
    color: "#8b5cf6",
    icon: "Sparkles",
    isPro: false,
    count: 18,
  },
  {
    id: "type_note",
    slug: "notes",
    name: "Notes",
    contentType: "TEXT",
    route: "/items/notes",
    color: "#fde047",
    icon: "StickyNote",
    isPro: false,
    count: 27,
  },
  {
    id: "type_command",
    slug: "commands",
    name: "Commands",
    contentType: "TEXT",
    route: "/items/commands",
    color: "#f97316",
    icon: "Terminal",
    isPro: false,
    count: 14,
  },
  {
    id: "type_link",
    slug: "links",
    name: "Links",
    contentType: "URL",
    route: "/items/links",
    color: "#10b981",
    icon: "Link",
    isPro: false,
    count: 33,
  },
  {
    id: "type_file",
    slug: "files",
    name: "Files",
    contentType: "FILE",
    route: "/items/files",
    color: "#6b7280",
    icon: "File",
    isPro: true,
    count: 0,
  },
  {
    id: "type_image",
    slug: "images",
    name: "Images",
    contentType: "FILE",
    route: "/items/images",
    color: "#ec4899",
    icon: "Image",
    isPro: true,
    count: 0,
  },
];

export const collections: Collection[] = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Hooks, render patterns & reusable component recipes",
    isFavorite: true,
    itemCount: 24,
    itemTypeIds: ["type_snippet", "type_note", "type_link"],
  },
  {
    id: "col_ai_prompts",
    name: "AI Prompts",
    description: "System messages & reusable prompt templates",
    isFavorite: true,
    itemCount: 31,
    itemTypeIds: ["type_prompt"],
  },
  {
    id: "col_deploy_commands",
    name: "Deploy Commands",
    description: "Docker, CI/CD pipelines & shell one-liners",
    isFavorite: false,
    itemCount: 12,
    itemTypeIds: ["type_command", "type_snippet"],
  },
  {
    id: "col_python_snippets",
    name: "Python Snippets",
    description: "Data scripts, utilities & FastAPI helpers",
    isFavorite: false,
    itemCount: 19,
    itemTypeIds: ["type_snippet", "type_note"],
  },
  {
    id: "col_design_inspiration",
    name: "Design Inspiration",
    description: "Sites, palettes & UI references worth stealing",
    isFavorite: true,
    itemCount: 28,
    itemTypeIds: ["type_link", "type_image"],
  },
  {
    id: "col_context_files",
    name: "Context Files",
    description: "Project context, specs & LLM reference docs",
    isFavorite: false,
    itemCount: 9,
    itemTypeIds: ["type_file", "type_note"],
  },
  {
    id: "col_interview_prep",
    name: "Interview Prep",
    description: "DSA notes, system design & take-home questions",
    isFavorite: true,
    itemCount: 22,
    itemTypeIds: ["type_note", "type_snippet", "type_link"],
  },
  {
    id: "col_course_notes",
    name: "Course Notes",
    description: "Lecture notes, diagrams & study material",
    isFavorite: false,
    itemCount: 15,
    itemTypeIds: ["type_note", "type_image"],
  },
];

export const pinnedItems: Item[] = [
  {
    id: "item_use_debounce",
    title: "useDebounce hook",
    itemTypeId: "type_snippet",
    preview: "export function useDebounce<T>(value: T, delay = 300) {",
    language: "typescript",
    tags: ["react", "hooks", "typescript"],
    isPinned: true,
    isFavorite: true,
    updatedAt: "2h ago",
  },
  {
    id: "item_senior_code_reviewer",
    title: "Senior Code Reviewer",
    itemTypeId: "type_prompt",
    preview:
      "You are a meticulous senior software engineer reviewing a PR…",
    tags: ["review", "system", "meta"],
    isPinned: true,
    isFavorite: true,
    updatedAt: "5h ago",
  },
  {
    id: "item_prune_docker",
    title: "Prune Docker system",
    itemTypeId: "type_command",
    preview: "docker system prune -af --volumes",
    language: "bash",
    tags: ["docker", "cleanup", "ops"],
    isPinned: true,
    isFavorite: false,
    updatedAt: "yesterday",
  },
  {
    id: "item_neon_pooled_connection",
    title: "Neon pooled connection",
    itemTypeId: "type_note",
    preview:
      "Serverless connections should use the pooled endpoint (-pooler host)…",
    tags: ["neon", "postgres", "prisma"],
    isPinned: true,
    isFavorite: false,
    updatedAt: "2d ago",
  },
];

export const recentItems: Item[] = [
  {
    id: "item_container_query_grid",
    title: "Container query card grid",
    itemTypeId: "type_snippet",
    preview:
      "@container (min-width: 480px) { .card { grid-template-columns: 1fr 1fr; } }",
    language: "css",
    tags: ["css", "layout", "responsive"],
    isPinned: false,
    isFavorite: false,
    updatedAt: "18m ago",
  },
  {
    id: "item_prisma_migrate_deploy",
    title: "Prisma migrate deploy",
    itemTypeId: "type_command",
    preview: "npx prisma migrate deploy",
    language: "bash",
    tags: ["prisma", "ci", "db"],
    isPinned: false,
    isFavorite: false,
    updatedAt: "1h ago",
  },
  {
    id: "item_shadcn_components",
    title: "shadcn/ui components",
    itemTypeId: "type_link",
    preview: "https://ui.shadcn.com",
    tags: ["ui", "react", "reference"],
    isPinned: false,
    isFavorite: true,
    updatedAt: "3h ago",
  },
  {
    id: "item_rate_limiting_redis",
    title: "Rate limiting with Redis",
    itemTypeId: "type_note",
    preview:
      "Token bucket vs sliding window log — trade-offs for the API layer…",
    tags: ["redis", "api", "scaling"],
    isPinned: false,
    isFavorite: false,
    updatedAt: "6h ago",
  },
  {
    id: "item_prompt_optimizer_template",
    title: "Prompt optimizer template",
    itemTypeId: "type_prompt",
    preview: "Rewrite the following prompt to be clearer and more specific…",
    tags: ["meta", "optimize"],
    isPinned: false,
    isFavorite: false,
    updatedAt: "yesterday",
  },
  {
    id: "item_auth_flow_diagram",
    title: "Auth flow diagram",
    itemTypeId: "type_image",
    preview: "auth-flow.png — NextAuth session + GitHub OAuth handshake",
    tags: ["auth", "diagram", "nextauth"],
    isPinned: false,
    isFavorite: false,
    updatedAt: "2d ago",
  },
];