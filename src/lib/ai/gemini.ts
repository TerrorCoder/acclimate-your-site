/**
 * Google Gemini API integration (REST-based, zero extra dependencies).
 * Supports gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-flash.
 */

export interface GeminiOptions {
  apiKey?: string;
  model?: string;
}

export async function callGemini(
  systemInstruction: string,
  userPrompt: string,
  options: GeminiOptions = {},
): Promise<string | null> {
  const apiKey =
    options.apiKey ||
    (import.meta.env['VITE_GEMINI_API_KEY'] as string | undefined) ||
    (typeof window !== "undefined" ? localStorage.getItem("acclimate_gemini_key") || undefined : undefined);

  if (!apiKey) return null;

  const model = options.model || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Acclimate/AI] Gemini API error (${res.status}):`, errText);
      return null;
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ?? null;
  } catch (err) {
    console.warn("[Acclimate/AI] Gemini network error:", err);
    return null;
  }
}
