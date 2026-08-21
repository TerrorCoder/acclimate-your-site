/**
 * Thin OpenAI client wrapper.
 *
 * Reads VITE_OPENAI_API_KEY from the Vite env. If the key is absent the
 * helper returns null so the deterministic fallback in getRecommendation.ts
 * takes over automatically — no crashes, no user-facing errors.
 *
 * Uses the official openai SDK with dangerouslyAllowBrowser: true because
 * this is intentional client-side usage during development. When moving to
 * a static host the call should be proxied through a Cloudflare Worker.
 */

import OpenAI from "openai";

const API_KEY = import.meta.env['VITE_OPENAI_API_KEY'] as string | undefined;

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Send a message thread to GPT-4o-mini and return the raw text response.
 * Returns null if the key is missing or the request fails — caller falls back
 * to the deterministic engine.
 */
export async function callOpenAI(messages: ChatMessage[]): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4, // low temperature keeps responses factual and consistent
      max_tokens: 900,
    });
    return completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    console.warn("[Acclimate/AI] OpenAI request failed, using deterministic fallback:", err);
    return null;
  }
}

export const hasOpenAI = Boolean(API_KEY);
