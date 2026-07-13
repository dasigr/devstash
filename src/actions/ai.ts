"use server";

import { z } from "zod";

import type { ActionResult } from "@/actions/items";
import { auth } from "@/auth";
import { parseSuggestedTags } from "@/lib/ai-tags";
import { cleanSummary } from "@/lib/ai-summary";
import { cleanExplanation } from "@/lib/ai-explain";
import { getCurrentUser } from "@/lib/db/user";
import { aiModel, isOpenAIConfigured, openai } from "@/lib/openai";
import { canUseAi } from "@/lib/plan";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  AUTO_TAG_CONTENT_LIMIT,
  autoTagSchema,
  EXPLAIN_CONTENT_LIMIT,
  explainCodeSchema,
  SUMMARY_CONTENT_LIMIT,
  summarySchema,
} from "@/lib/validations/ai";

const AUTO_TAG_INSTRUCTIONS =
  "You are a developer knowledge-base assistant. Given a saved item's title and " +
  "content, suggest 3 to 5 short, lowercase, freeform tags that would help a " +
  "developer find and organize it (languages, frameworks, concepts, purpose). " +
  'Respond ONLY with JSON of the form {"tags": ["tag1", "tag2"]}. Keep each tag ' +
  "to one or two words. Do not include explanations.";

/**
 * Suggest 3–5 freeform tags for an item using OpenAI (Pro-only). Follows the
 * standard action pattern: auth → configured → Pro gate → validate → rate limit
 * → call the model → parse. Uses the Responses API with json_object format
 * (gpt-5-nano returns empty content on Chat Completions and hits length limits
 * with structured output), then parses the text manually.
 */
export async function generateAutoTags(
  input: unknown,
): Promise<ActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  if (!isOpenAIConfigured()) {
    return { success: false, error: "AI is not available right now." };
  }

  const parsed = autoTagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getCurrentUser();
  const isPro = user?.isPro ?? false;
  if (!canUseAi(isPro)) {
    return { success: false, error: "AI tagging is a Pro feature." };
  }

  const rate = await checkRateLimit("ai", session.user.id);
  if (!rate.success) {
    return {
      success: false,
      error: "You've used your AI tag suggestions for now. Try again later.",
    };
  }

  const { title, content } = parsed.data;
  const truncated = content.slice(0, AUTO_TAG_CONTENT_LIMIT);
  // The word "json" must appear in the input itself (not only the
  // instructions) for the Responses API json_object format to be accepted.
  const promptInput =
    'Suggest tags for this item. Respond as JSON of the form ' +
    '{"tags": ["tag1", "tag2"]}.\n\n' +
    `Title: ${title}\n\nContent:\n${truncated}`;

  try {
    const response = await openai().responses.create({
      model: aiModel(),
      instructions: AUTO_TAG_INSTRUCTIONS,
      input: promptInput,
      text: { format: { type: "json_object" } },
    });

    const tags = parseSuggestedTags(response.output_text ?? "");
    return { success: true, data: tags };
  } catch (error) {
    console.error("Failed to generate auto tags:", error);
    return { success: false, error: "Something went wrong generating tags." };
  }
}

const SUMMARY_INSTRUCTIONS =
  "You are a developer knowledge-base assistant. Given a saved item's title and " +
  "content, write a clear, concise 1 to 2 sentence description that captures " +
  "what it is and what it's for, to help a developer recognize it at a glance. " +
  "Respond with ONLY the description text — no preamble, no labels, no quotes.";

/**
 * Generate a concise 1–2 sentence description for an item using OpenAI
 * (Pro-only). Same pattern as generateAutoTags: auth → configured → validate →
 * Pro gate → rate limit → call the model → normalize. Uses the Responses API
 * with plain-text output (no json_object format), so the result is just
 * cleaned text — no JSON parse and no "json in input" requirement.
 */
export async function generateSummary(
  input: unknown,
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  if (!isOpenAIConfigured()) {
    return { success: false, error: "AI is not available right now." };
  }

  const parsed = summarySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getCurrentUser();
  const isPro = user?.isPro ?? false;
  if (!canUseAi(isPro)) {
    return { success: false, error: "AI summaries are a Pro feature." };
  }

  const rate = await checkRateLimit("ai", session.user.id);
  if (!rate.success) {
    return {
      success: false,
      error: "You've used your AI requests for now. Try again later.",
    };
  }

  const { title, content } = parsed.data;
  const truncated = content.slice(0, SUMMARY_CONTENT_LIMIT);
  const promptInput = truncated
    ? `Title: ${title}\n\nContent:\n${truncated}`
    : `Title: ${title}`;

  try {
    const response = await openai().responses.create({
      model: aiModel(),
      instructions: SUMMARY_INSTRUCTIONS,
      input: promptInput,
    });

    const summary = cleanSummary(response.output_text ?? "");
    if (summary.length === 0) {
      return { success: false, error: "The AI didn't return a description." };
    }
    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return {
      success: false,
      error: "Something went wrong generating the description.",
    };
  }
}

const EXPLAIN_INSTRUCTIONS =
  "You are a senior developer explaining code to a teammate. Given a code " +
  "snippet or terminal command (with its title and language), write a clear, " +
  "concise explanation of about 200 to 300 words covering what it does and the " +
  "key concepts involved. Use GitHub-flavored Markdown — short paragraphs, " +
  "inline `code`, and bullet lists where helpful. Do not repeat the whole input " +
  "verbatim in a large code block. Respond with only the explanation.";

/**
 * Generate a concise Markdown explanation of a code snippet or command using
 * OpenAI (Pro-only). Same pattern as generateSummary: auth → configured →
 * validate → Pro gate → rate limit → call the model → normalize. Uses the
 * Responses API with plain-text output (no json_object format); the result is
 * cleaned Markdown, so no JSON parse and no "json in input" requirement.
 */
export async function explainCode(
  input: unknown,
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  if (!isOpenAIConfigured()) {
    return { success: false, error: "AI is not available right now." };
  }

  const parsed = explainCodeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getCurrentUser();
  const isPro = user?.isPro ?? false;
  if (!canUseAi(isPro)) {
    return { success: false, error: "AI code explanations are a Pro feature." };
  }

  const rate = await checkRateLimit("ai", session.user.id);
  if (!rate.success) {
    return {
      success: false,
      error: "You've used your AI requests for now. Try again later.",
    };
  }

  const { title, content, language } = parsed.data;
  const truncated = content.slice(0, EXPLAIN_CONTENT_LIMIT);
  const languageLine = language ? `Language: ${language}\n` : "";
  const promptInput = `Title: ${title}\n${languageLine}\nCode:\n${truncated}`;

  try {
    const response = await openai().responses.create({
      model: aiModel(),
      instructions: EXPLAIN_INSTRUCTIONS,
      input: promptInput,
    });

    const explanation = cleanExplanation(response.output_text ?? "");
    if (explanation.length === 0) {
      return { success: false, error: "The AI didn't return an explanation." };
    }
    return { success: true, data: explanation };
  } catch (error) {
    console.error("Failed to explain code:", error);
    return {
      success: false,
      error: "Something went wrong generating the explanation.",
    };
  }
}
