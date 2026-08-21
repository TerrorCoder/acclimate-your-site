/**
 * ActionChips — inline AI-powered action suggestions that appear within data panels.
 *
 * Makes a single lightweight OpenAI call on mount to get 2-3 short, specific actions
 * the user can take based on current conditions and a domain focus (e.g. "conditions",
 * "weekly", "wind", "uv").
 *
 * Each chip is clickable and opens the AskAI panel pre-filled with that question.
 * Renders nothing if OpenAI is unavailable (no key → no chips, no error).
 */

import { useEffect, useState } from "react";

import { callOpenAI } from "@/lib/ai/openai";
import { buildActionChipsPrompt } from "@/lib/ai/prompts";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

interface ActionChipsProps {
  domain: string;
}

export function ActionChips({ domain }: ActionChipsProps) {
  const { context } = useEnvironment();
  const [chips, setChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!context) return;

    let cancelled = false;
    setLoading(true);

    const prompt = buildActionChipsPrompt(context, domain);

    callOpenAI([
      { role: "system", content: prompt },
      { role: "user", content: "Return the chips JSON now." },
    ])
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw) as { chips?: string[] };
          if (Array.isArray(parsed.chips)) {
            setChips(parsed.chips.slice(0, 3));
          }
        } catch {
          // Silently ignore parse errors — chips are a nice-to-have
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [context, domain]);

  // Don't render if no chips and not loading, or if OpenAI is unavailable
  if (!loading && chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="eyebrow" style={{ color: "var(--color-ai)" }}>
        What you can do
      </span>
      {loading && chips.length === 0 ? (
        <>
          <span className="h-7 w-32 animate-pulse rounded-full bg-surface-strong" />
          <span className="h-7 w-40 animate-pulse rounded-full bg-surface-strong" />
          <span className="h-7 w-28 animate-pulse rounded-full bg-surface-strong" />
        </>
      ) : (
        chips.map((chip) => (
          <button
            key={chip}
            type="button"
                      onClick={() => {
              // Dispatch custom event so the globally-mounted AskAI panel opens
              window.dispatchEvent(new CustomEvent("acclimate:ask", { detail: chip }));
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-surface hover:text-primary"
            title="Click to ask AI about this"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 shrink-0"
              style={{ color: "var(--color-ai)" }}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 3.5 13.7 8l4.5 1.7-4.5 1.7L12 16l-1.7-4.6L5.8 9.7 10.3 8 12 3.5ZM18.5 15l.8 2.1 2.2.9-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.9.8-2.1Z" />
            </svg>
            {chip}
          </button>
        ))
      )}
    </div>
  );
}
