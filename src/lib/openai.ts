import OpenAI from "openai";

// Server-side OpenAI client for Pro AI features. Mirrors the lazy pattern in
// src/lib/stripe.ts and src/lib/r2.ts: the client is built on first use and
// memoized, so importing this module is cheap and never throws when
// OPENAI_API_KEY is unset. Callers guard with isOpenAIConfigured() before
// using openai().

let client: OpenAI | null = null;

/** Whether the OpenAI API key needed to talk to the API is present. */
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Lazily build (and memoize) the OpenAI client. */
export function openai(): OpenAI {
  if (client) return client;
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  return client;
}

/**
 * The AI model id, overridable via env so a newer/cheaper tier can be bumped
 * without a code change (same reason stripe.ts reads price ids from env).
 * Defaults to the cheap nano tier.
 */
export const AI_MODEL = "gpt-5-nano";

/** The configured AI model id (env override or the default nano tier). */
export function aiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || AI_MODEL;
}
