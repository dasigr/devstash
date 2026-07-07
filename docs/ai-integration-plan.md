# AI Integration Plan

> **Research document — not an implementation.** Investigates best practices for wiring the
> project's four planned Pro-only AI features into this Next.js 16 codebase. Produced by
> `/research ai-integration-research.md`. No source code changed.

## Scope

Four AI features from `context/project-overview.md` §3.F (all **Pro-only**):

| Feature | Input | Output shape | Streaming? |
| --- | --- | --- | --- |
| **Auto-tagging** | item content/title | `string[]` (suggested tags) | No — structured |
| **AI summaries** | item content | short markdown text | Optional |
| **Code explanation** | snippet content + language | markdown text | **Yes** (feels fast) |
| **Prompt optimizer** | a prompt (text) | rewritten prompt + notes | Optional |

---

## 0. Findings about the current codebase (read before planning)

Two of the prompt's cited sources **do not exist yet** — plan accordingly:

- **`src/actions/*.ts`** — there is **no `src/actions/` directory**. The app has zero Server
  Actions today; all mutations so far live in **route handlers** under `src/app/api/**` (auth
  flows). AI features are the natural place to introduce the first Server Actions.
- **`src/lib/usage-limits.ts`** — does **not exist**. Pro gating is currently only the
  `User.isPro` boolean (schema + `getCurrentUser()`), plus the freemium table in
  `project-overview.md` (§7) and the open note (§9) to "build the limit checks (50 items,
  3 collections) now behind a flag." No quota-enforcement helper has been written.

Patterns that **do** exist and should be mirrored:

- **`src/lib/rate-limit.ts`** — a clean, fail-open, lazily-configured Upstash limiter with a
  typed `RATE_LIMITS` registry. AI rate limiting should extend this exact pattern.
- **`src/lib/features.ts`** — env-flag helpers (`isEmailVerificationEnabled()`). Add
  `isAiEnabled()` here.
- **`src/lib/prisma.ts`** — singleton with a global cache in dev. The AI client should follow
  the same lazy-singleton shape.
- **`src/lib/validations/auth.ts`** — Zod schemas shared between client and server. AI inputs
  get their own `src/lib/validations/ai.ts`.
- **`{ success, data, error }` return pattern** — used by every API route; the coding standards
  (`context/coding-standards.md`) mandate it for Server Actions too.
- **`User.isPro`** + `getCurrentUser()` in `src/lib/db/user.ts` — the gate source of truth.

No `openai`, `ai`, or `@ai-sdk/*` package is installed, and there are **no AI env vars** in
`.env.example`.

---

## 1. Recommendation: SDK choice

The spec names **OpenAI `gpt-5-nano`** directly. Two credible ways to call it:

| Option | What it is | Verdict |
| --- | --- | --- |
| **A. Vercel AI SDK v6** (`ai` + provider string via AI Gateway) | TypeScript toolkit; `generateObject`/`generateText`/`streamText`; Zod-native structured output; provider-agnostic | ✅ **Recommended** |
| B. Official `openai` SDK directly | `openai.responses.create(...)` with `response_format` JSON schema | Fine, more boilerplate |

**Recommend Option A (AI SDK v6).** Reasons specific to this project:

- **Structured output is first-class.** `generateObject({ schema: z.object({ tags: z.array(z.string()) }) })`
  returns a typed, validated object — exactly what auto-tagging needs — with no manual JSON parsing
  or `response_format` plumbing. The SDK converts the Zod schema to the model's native
  structured-output API and validates + retries for you.
- **Streaming is trivial.** `streamText` for code explanation; the client reads it with the SDK's
  React hooks. Matches the "feels fast" UX the drawer wants.
- **Platform-native on Vercel.** Per the session's Vercel guidance, prefer plain
  `"provider/model"` strings routed through **AI Gateway** (observability, fallbacks, one key)
  rather than hard-wiring `@ai-sdk/openai`. Use a bare provider string like
  `"openai/gpt-5.4-nano"` unless you deliberately want direct provider wiring.
- **Zod is already a dependency** (`zod@^4`), so schema definitions cost nothing new.

**Model note (from OpenAI docs, July 2026):** `gpt-5-nano` still exists, but OpenAI now steers
new cost/speed-sensitive workloads to **`gpt-5.4-nano`**. Nano is explicitly recommended for
**summarization and classification** — i.e. our auto-tag + summary features. Keep the model id in
**one env-driven constant** (`AI_MODEL`, default `openai/gpt-5.4-nano`) so it's a one-line swap.

> If you'd rather not adopt AI Gateway yet, Option B with the `openai` package is a valid
> fallback; the architecture below (Server Actions, gating, rate limiting, Zod) is identical —
> only the "call the model" line changes.

### Suggested dependencies

```
npm i ai zod            # zod already present
# provider string "openai/..." resolves through Vercel AI Gateway (no @ai-sdk/openai needed)
# OR, for Option B:  npm i openai
```

---

## 2. Configuration & the AI client

Create `src/lib/ai/client.ts` — a lazy singleton mirroring `prisma.ts` / `rate-limit.ts`:

- Read the API key **once** from env (`AI_GATEWAY_API_KEY` for Gateway, or `OPENAI_API_KEY` for
  direct). **Never** expose it to the client — AI calls run only in Server Actions / route
  handlers (server-only modules).
- Export a small typed wrapper, e.g. `generateTags(text)`, `summarize(text)`,
  `explainCode(code, language)`, `optimizePrompt(text)` — so callers never touch the model id or
  schema directly and the model is swappable in one place.
- Centralize the model id: `const AI_MODEL = process.env.AI_MODEL ?? "openai/gpt-5.4-nano"`.

**New env vars** to add to `.env` (real) and `.env.example` (documented, per the repo's
un-ignore-`.env.example` convention):

```
# AI features
AI_ENABLED="false"                 # master feature flag (mirror EMAIL_VERIFICATION_ENABLED)
AI_MODEL="openai/gpt-5.4-nano"
AI_GATEWAY_API_KEY="..."           # if using Vercel AI Gateway (Option A)
# OPENAI_API_KEY="..."             # if calling OpenAI directly (Option B)
```

Add `isAiEnabled()` to `src/lib/features.ts` (same shape as `isEmailVerificationEnabled()`).
The AI client should **fail gracefully** when unconfigured (return a friendly error, never throw
an unhandled 500) — matching the fail-open ethos of `rate-limit.ts` (though AI should *fail
closed*: no key → feature unavailable, not silently "allowed").

---

## 3. Server Action patterns (the first in this repo)

Per `context/coding-standards.md`: **Server Actions for form submissions and simple mutations**;
API routes only for webhooks/uploads/streaming-with-status. AI actions are simple request/response
mutations → **Server Actions**, except code-explanation streaming (see §4).

Create `src/actions/ai.ts` (`"use server"`), one action per feature. Every action follows the
**same guard pipeline**, in this order (cheapest checks first):

```
1. isAiEnabled()            → feature flag off?     → { success:false, error:"AI is unavailable" }
2. getCurrentUser()         → no session?           → { success:false, error:"Not signed in" }
3. user.isPro               → free user?            → { success:false, error:"Upgrade to Pro", code:"pro_required" }
4. Zod parse the input      → invalid?              → { success:false, error: <first issue> }
5. checkRateLimit(...)      → throttled?            → { success:false, error:"Too many requests", code:"rate_limited" }
6. call the model (try/catch)                        → { success:true, data } | { success:false, error }
```

Return the **`{ success, data, error }`** shape the codebase already uses everywhere. Skeleton:

```ts
// src/actions/ai.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/db/user";
import { isAiEnabled } from "@/lib/features";
import { checkAiRateLimit } from "@/lib/rate-limit"; // new helper, see §6
import { autoTagSchema } from "@/lib/validations/ai";
import { generateTags } from "@/lib/ai/client";

export async function suggestTags(input: unknown) {
  if (!isAiEnabled()) return { success: false, error: "AI features are unavailable." } as const;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "You must be signed in." } as const;
  if (!user.isPro)
    return { success: false, error: "Upgrade to Pro to use AI features.", code: "pro_required" } as const;

  const parsed = autoTagSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." } as const;

  const rl = await checkAiRateLimit("aiTag", user.id);
  if (!rl.success)
    return { success: false, error: "Too many requests. Try again shortly.", code: "rate_limited" } as const;

  try {
    const tags = await generateTags(parsed.data.content);
    return { success: true, data: { tags } } as const;
  } catch (err) {
    console.error("suggestTags failed:", err);
    return { success: false, error: "Could not generate tags. Please try again." } as const;
  }
}
```

Keep each action **under 50 lines** (coding standard). Factor the guard pipeline (steps 1–5) into
a shared `requireProAiUser()` helper returning `{ ok:true, user } | { ok:false, response }` so each
action body is just parse → rate-limit → call.

**Auto-tagging structured output** — with AI SDK v6:

```ts
// inside src/lib/ai/client.ts
const { object } = await generateObject({
  model: AI_MODEL,
  schema: z.object({ tags: z.array(z.string().min(1).max(30)).max(8) }),
  prompt: `Suggest up to 8 short, lowercase topic tags for this content...\n\n${text}`,
});
return object.tags;
```

Structured Outputs guidance (OpenAI, 2026): **don't** describe the JSON shape in the prompt — let
the schema drive it; describe only the *task*. For nano-class models, be **explicit and a bit
verbose** — they follow instructions well but won't infer missing steps.

---

## 4. Streaming vs non-streaming

| Feature | Mode | Why |
| --- | --- | --- |
| Auto-tagging | **Non-streaming** (`generateObject`) | Structured array; nothing to stream; short |
| AI summary | Non-streaming (short) | A few sentences; simpler UX; can stream later |
| **Code explanation** | **Streaming** (`streamText`) | Longer output; token-by-token feels fast in the drawer |
| Prompt optimizer | Non-streaming | Returns a rewritten block; show on complete |

**Streaming implementation** — streaming can't ride a plain Server Action return value, so use a
**route handler** for code explanation:

- `POST src/app/api/ai/explain/route.ts` → runs the **same guard pipeline** (§3), then
  `return streamText({ model, prompt }).toUIMessageStreamResponse()` (AI SDK v6).
- Client component consumes it with the AI SDK React hooks (progressive render + a stop button).
- All other features stay as Server Actions called from client components.

This split matches the coding standard exactly: "Use API routes when you need … streaming /
long-running operations; otherwise Server Actions."

---

## 5. Pro gating patterns

**Source of truth:** `User.isPro` via `getCurrentUser()` (`src/lib/db/user.ts`). Note the repo's
current stance (§7 of the overview): *"During development, all users can access everything."* So:

- **Server-side (authoritative):** every AI action/route checks `user.isPro` (step 3 above) and
  returns `code: "pro_required"` when false. This is the real gate — never trust the client.
- **Feature flag:** gate the whole subsystem behind `AI_ENABLED` so it can ship dark.
- **Dev override (optional):** to honor "everything unlocked in dev," you *could* let
  `isProOrDev(user)` treat any signed-in user as Pro while `AI_ENABLED` is on in non-prod. Decide
  deliberately — the safer default is to gate strictly on `isPro` even in dev so the gate is
  actually exercised.
- **This is the moment to create `src/lib/usage-limits.ts`** (the missing file the prompt cited).
  Give it a typed registry mirroring `RATE_LIMITS`:

  ```ts
  // src/lib/usage-limits.ts
  export const PLAN_LIMITS = {
    free: { items: 50, collections: 3, ai: false, fileUploads: false },
    pro:  { items: Infinity, collections: Infinity, ai: true, fileUploads: true },
  } as const;

  export function canUseAi(user: { isPro: boolean }): boolean {
    return PLAN_LIMITS[user.isPro ? "pro" : "free"].ai;
  }
  ```

  This also satisfies the §9 open note ("build the 50-item / 3-collection checks now behind a
  flag") in the same place, so AI gating and quota gating share one module.

**Client-side (UX only):** thread `user.isPro` (already available via `getCurrentUser()` in server
components) to show an **"Upgrade to Pro"** affordance instead of the AI button for free users.
Cosmetic — the server check is what protects the API.

---

## 6. Error handling & rate limiting

**Error handling** — reuse the established discipline:

- `try/catch` around every model call; log the real error server-side, return a **generic,
  friendly** message to the client (never leak provider errors or the prompt).
- Distinguish failure classes with a `code` field so the UI can react:
  `pro_required`, `rate_limited`, `ai_unavailable`, generic.
- Surface via **toast** (the app's `toastManager` / Base UI toaster) — consistent with existing
  flows.

**Rate limiting** — **extend `src/lib/rate-limit.ts`**, don't reinvent it. AI calls cost money, so
limits matter more here than for auth. Add AI entries to the `RATE_LIMITS` registry:

```ts
// additions to RATE_LIMITS in src/lib/rate-limit.ts
aiTag:      { limit: 20, window: "1 h", prefix: "rl:ai:tag" },
aiSummary:  { limit: 20, window: "1 h", prefix: "rl:ai:summary" },
aiExplain:  { limit: 20, window: "1 h", prefix: "rl:ai:explain" },
aiPrompt:   { limit: 20, window: "1 h", prefix: "rl:ai:prompt" },
```

- **Key by user id** (`user.id`), not IP — AI is behind auth, so per-user budgets are correct and
  fairer than per-IP.
- Reuse `checkRateLimit(key, identifier)` as-is (it already returns `{ success, remaining, reset }`).
- **One difference from auth:** auth limiters **fail open** (a Redis outage must not lock people
  out). For AI, consider **failing closed** or at least keeping the fail-open but relying on the
  provider's own limits as a backstop — an AI outage of the limiter shouldn't enable unbounded
  spend. Document the choice; simplest is to keep fail-open and add a hard provider-side cap.
- For streaming (route handler), also return the existing `rateLimitResponse()` 429 with
  `Retry-After` when throttled.

---

## 7. Cost optimization

`gpt-5.4-nano` is already the cheapest/fastest tier — the right default. Beyond model choice:

- **Prompt caching** — nano supports it. Keep the **system/instruction prefix identical** across
  calls of the same feature (put the static rubric first, the variable content last) so the
  provider caches the prefix. Big win for auto-tag/summarize run repeatedly.
- **Cap `maxOutputTokens`** per feature (tags need very few; summaries a few hundred; explanations
  more). Small caps directly cap cost and latency.
- **Truncate/limit input** — enforce a max input length in the Zod schema (e.g. reject or trim
  content over N chars) so a user can't paste a megabyte into the summarizer. Protects cost *and*
  is input sanitization (§8).
- **Debounce auto-tag** — if triggered on content change, debounce; ideally only run on an explicit
  "Suggest tags" click, not on every keystroke.
- **Cache results where stable** — the same snippet's explanation doesn't change; a per-item cached
  `aiSummary` / `aiExplanation` column (or a keyed cache) avoids re-billing repeat opens. (Schema
  addition — would need a **migration**, never `db push`.)
- **Batch API** — for any future bulk "tag my whole library" job, OpenAI's Batch API is ~half price
  for non-interactive work.
- **Rate limits (§6)** are also a cost control, not just abuse control.

---

## 8. UI patterns for AI features

Match the app's existing feel (drawer-based items, toasts, loading skeletons, ShadCN/Base UI):

- **Loading states** — a spinner/shimmer on the AI button while pending; for streaming code
  explanation, render tokens progressively (skeleton → streaming text) with a **Stop** button.
- **Accept / reject suggestions** — auto-tag is the key case: show suggested tags as **dismissible
  chips** with **"Add"** per chip (or "Add all" / "Dismiss"). Never auto-apply — the user curates.
  Summaries/optimized prompts get **"Insert"** / **"Copy"** / **"Regenerate"** actions; don't
  overwrite the user's content silently.
- **Regenerate** — cheap on nano; offer it, but count it against the rate limit.
- **Empty/again states** — "No suggestions" and a retry path on error (toast + inline).
- **Pro affordance** — free users see an "Upgrade to Pro" prompt where the AI action would be
  (§5), not a dead button.
- **Optimistic-but-safe** — since these are Server Actions, use `useTransition`/pending state; don't
  block the whole drawer, just the AI control.

Place AI controls **inside the item drawer** (where content is edited/read) — consistent with
"items should be quick to create and open inside a drawer."

---

## 9. Security considerations

- **API key handling** — key lives **only** in server env, read in `src/lib/ai/client.ts` (a
  server-only module). Never imported into a client component; never returned to the browser; never
  logged. Keep it out of `NEXT_PUBLIC_*`. Same discipline as `DATABASE_URL` / Upstash tokens today.
- **Keep AI off the edge/proxy bundle** — like `rate-limit.ts` and `prisma.ts`, the AI client must
  only be imported by Server Actions / Node route handlers, **never** by `src/proxy.ts` or
  `src/auth.config.ts`, so the edge bundle stays clean (the repo already guards this boundary
  carefully).
- **Input validation & sanitization** — Zod-validate every AI input (`src/lib/validations/ai.ts`):
  enforce type, non-empty, and a **max length** (cost + abuse). Treat all content as untrusted.
- **Prompt-injection awareness** — user content is the data being summarized/explained, so treat it
  as **data, not instructions**: keep the system/instruction prompt separate from user content, and
  never let AI output trigger side effects (it only ever returns suggestions the user must accept).
  Don't feed AI output into anything executable.
- **Output handling** — AI returns markdown/text rendered in the UI; render it safely (the existing
  markdown pipeline / escaping) — don't `dangerouslySetInnerHTML` raw model output.
- **Authz on every call** — session + `isPro` checked server-side on **every** action and the
  streaming route (§3, §5). No AI endpoint is reachable unauthenticated.
- **Rate limiting** (§6) — per-user, as brute-force/abuse/cost protection.
- **No PII to logs** — log error *types*, not prompt contents.

---

## 10. Suggested file layout (all new)

```
src/
  actions/
    ai.ts                     # "use server" — suggestTags, summarize, optimizePrompt (Server Actions)
  app/api/ai/
    explain/route.ts          # streaming code explanation (route handler)
  lib/
    ai/
      client.ts               # lazy singleton + generateTags/summarize/explainCode/optimizePrompt
      prompts.ts              # the four prompt/instruction strings (static prefixes for caching)
    validations/
      ai.ts                   # Zod schemas (with max-length caps)
    usage-limits.ts           # NEW — PLAN_LIMITS registry + canUseAi() (also covers 50-item/3-collection note)
    features.ts               # + isAiEnabled()
    rate-limit.ts             # + aiTag/aiSummary/aiExplain/aiPrompt entries
  components/
    ai/                       # AiTagSuggestions, AiSummaryButton, CodeExplainer (streaming), PromptOptimizer
```

**Migrations reminder:** if you add cached `aiSummary`/`aiExplanation` columns (§7), do it with
`prisma migrate dev` — **never** `db push` (project policy), against the Neon **development**
branch.

---

## 11. Open questions to resolve before building

1. **AI Gateway vs direct OpenAI** — adopt Vercel AI Gateway (Option A, recommended) or wire
   `openai` directly (Option B)? Affects only env + the client module.
2. **Model id** — `gpt-5.4-nano` (OpenAI's current nano recommendation) vs the spec's literal
   `gpt-5-nano`? Recommend the former, pinned via `AI_MODEL`.
3. **Dev gating** — honor "everything unlocked in dev" for AI, or gate strictly on `isPro` so the
   gate is exercised? (Recommend strict.)
4. **Rate-limit failure mode** — fail-open (like auth) or fail-closed for cost safety?
5. **Result caching** — worth a schema column now, or defer? (Defer unless repeat-open cost is real.)
6. **Trigger for auto-tag** — explicit button (recommended) vs on-change debounce.

---

## Sources

- [GPT-5 nano Model — OpenAI API](https://developers.openai.com/api/docs/models/gpt-5-nano)
- [GPT-5.4 nano Model — OpenAI API](https://developers.openai.com/api/docs/models/gpt-5.4-nano)
- [Structured model outputs — OpenAI API](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Prompt guidance — OpenAI API](https://developers.openai.com/api/docs/guides/prompt-guidance)
- [Get started with GPT-5 — AI SDK cookbook](https://ai-sdk.dev/cookbook/guides/gpt-5)
- [AI SDK — Vercel docs](https://vercel.com/docs/ai-sdk)
- [AI SDK 6 — Vercel blog](https://vercel.com/blog/ai-sdk-6)
- [vercel/ai — GitHub](https://github.com/vercel/ai)
- Codebase: `src/lib/rate-limit.ts`, `src/lib/features.ts`, `src/lib/prisma.ts`,
  `src/lib/db/user.ts`, `src/lib/validations/auth.ts`, `context/project-overview.md` (§3.F, §6, §7, §9),
  `context/coding-standards.md`
