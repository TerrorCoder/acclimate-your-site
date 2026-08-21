/**
 * Unified AI Provider Manager
 * Supports Google Gemini & OpenAI with automatic key discovery & fallback.
 */

import { callGemini } from "./gemini";
import { callOpenAI, type ChatMessage } from "./openai";

export type AIProvider = "gemini" | "openai" | "fallback";

export interface AIStatus {
  provider: AIProvider;
  model: string;
  hasKey: boolean;
  source: "env" | "custom" | "none";
}

export function getActiveAIStatus(): AIStatus {
  if (typeof window === "undefined") {
    return { provider: "fallback", model: "deterministic-engine", hasKey: false, source: "none" };
  }

  const customGemini = localStorage.getItem("acclimate_gemini_key");
  const envGemini = import.meta.env['VITE_GEMINI_API_KEY'] as string | undefined;

  const customOpenAI = localStorage.getItem("acclimate_openai_key");
  const envOpenAI = import.meta.env['VITE_OPENAI_API_KEY'] as string | undefined;

  const preferred = localStorage.getItem("acclimate_preferred_provider");

  if (preferred === "openai" && (customOpenAI || envOpenAI)) {
    return {
      provider: "openai",
      model: "gpt-4o-mini",
      hasKey: true,
      source: customOpenAI ? "custom" : "env",
    };
  }

  if (customGemini || envGemini) {
    return {
      provider: "gemini",
      model: "gemini-2.0-flash",
      hasKey: true,
      source: customGemini ? "custom" : "env",
    };
  }

  if (customOpenAI || envOpenAI) {
    return {
      provider: "openai",
      model: "gpt-4o-mini",
      hasKey: true,
      source: customOpenAI ? "custom" : "env",
    };
  }

  return {
    provider: "fallback",
    model: "deterministic-reasoning-engine",
    hasKey: false,
    source: "none",
  };
}

/**
 * Execute unified JSON inference across whichever provider has a valid key.
 */
export async function executeAIInference(
  systemPrompt: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<{ text: string | null; provider: AIProvider }> {
  const status = getActiveAIStatus();

  if (status.provider === "gemini") {
    const text = await callGemini(systemPrompt, userMessage);
    if (text) return { text, provider: "gemini" };
  }

  if (status.provider === "openai") {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: userMessage },
    ];
    const text = await callOpenAI(messages);
    if (text) return { text, provider: "openai" };
  }

  // If active provider failed, try other if available
  if (status.provider === "gemini") {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: userMessage },
    ];
    const fallbackText = await callOpenAI(messages);
    if (fallbackText) return { text: fallbackText, provider: "openai" };
  } else if (status.provider === "openai") {
    const fallbackText = await callGemini(systemPrompt, userMessage);
    if (fallbackText) return { text: fallbackText, provider: "gemini" };
  }

  return { text: null, provider: "fallback" };
}

/**
 * Live test of an API key.
 */
export async function testAIConnection(
  provider: "gemini" | "openai",
  apiKey: string,
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const start = performance.now();
  try {
    if (provider === "gemini") {
      const res = await callGemini(
        "You are an environmental test assistant.",
        'Respond ONLY with JSON: {"status":"ok","message":"Gemini connected successfully"}',
        { apiKey },
      );
      const latency = Math.round(performance.now() - start);
      if (res && res.includes("ok")) {
        return { success: true, latencyMs: latency, message: `Connected to Gemini in ${latency}ms` };
      }
      return { success: false, latencyMs: latency, message: "Invalid response from Gemini. Check API key." };
    } else {
      const res = await callOpenAI(
        [
          { role: "system", content: "You are an environmental test assistant." },
          { role: "user", content: 'Respond ONLY with JSON: {"status":"ok","message":"OpenAI connected successfully"}' },
        ],
        { apiKey },
      );
      const latency = Math.round(performance.now() - start);
      if (res && res.includes("ok")) {
        return { success: true, latencyMs: latency, message: `Connected to OpenAI in ${latency}ms` };
      }
      return { success: false, latencyMs: latency, message: "Invalid response from OpenAI. Check API key." };
    }
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Math.round(performance.now() - start),
      message: err?.message || "Connection failed. Please check network and API key.",
    };
  }
}
