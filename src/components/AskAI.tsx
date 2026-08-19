import { useEffect, useState } from "react";

import { getRecommendation, SUGGESTED_QUESTIONS } from "@/lib/ai/getRecommendation";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import type { StructuredResponse } from "@/lib/env/types";
import { ResponseCard } from "@/components/ai/ResponseCard";
import { EmptyState } from "@/components/states";

export function AskAI() {
  const { context } = useEnvironment();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<StructuredResponse | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const ask = async (q: string) => {
    if (!context || !q.trim()) return;
    setQuestion(q);
    setLoading(true);
    const result = await getRecommendation("ask_ai", context, { question: q });
    setAnswer(result);
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_-18px_oklch(0_0_0/90%)] transition-transform hover:-translate-y-0.5"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3.5 13.7 8l4.5 1.7-4.5 1.7L12 16l-1.7-4.6L5.8 9.7 10.3 8 12 3.5ZM18.5 15l.8 2.1 2.2.9-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.9.8-2.1Z" />
        </svg>
        Ask AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Ask AI">
          <button
            type="button"
            aria-label="Close Ask AI"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <div className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-card p-4 md:p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow" style={{ color: "var(--color-ai)" }}>
                  Evidence-based assistant
                </p>
                <h2 className="display-md mt-1">Ask about today</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Answers are built from the same live environmental context as the rest of the site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border p-2 transition-colors hover:bg-surface"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(question);
              }}
            >
              <label className="sr-only" htmlFor="ask-input">
                Your question
              </label>
              <input
                id="ask-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Should I hold my event outside?"
                className="flex-1 rounded-full border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-ring"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                disabled={!context || loading}
              >
                Ask
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void ask(q)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {loading || answer ? (
                <ResponseCard response={answer ?? undefined} isLoading={loading} headline={question} />
              ) : (
                <EmptyState
                  title="No question yet"
                  message="Pick a suggestion or type your own. Every answer comes back as a structured decision, not a chat transcript."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
