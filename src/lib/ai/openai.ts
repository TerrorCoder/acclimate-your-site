/**
 * Standard REST-based OpenAI client.
 * Zero custom wrapper overhead — clean standard fetch.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIOptions {
  apiKey?: string;
  model?: string;
}

export async function callOpenAI(
  messages: ChatMessage[],
  options: OpenAIOptions = {},
): Promise<string | null> {
  const apiKey =
    options.apiKey ||
    (typeof window !== "undefined" ? localStorage.getItem("acclimate_openai_key") || undefined : undefined) ||
    (import.meta.env['VITE_OPENAI_API_KEY'] as string | undefined);

  if (!apiKey) {
    console.warn("[Acclimate/AI] No OpenAI API key found.");
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Acclimate/AI] OpenAI API error (${res.status}):`, errText);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return content ?? null;
  } catch (err: any) {
    console.warn("[Acclimate/AI] OpenAI network error:", err?.message || err);
    return null;
  }
}

export const hasOpenAI = Boolean(
  (typeof window !== "undefined" && localStorage.getItem("acclimate_openai_key")) ||
    import.meta.env['VITE_OPENAI_API_KEY'],
);
