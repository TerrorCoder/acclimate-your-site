import { useEffect, useRef, useState } from "react";

import { useChatSession } from "@/lib/ai/useChatSession";
import { getActiveAIStatus } from "@/lib/ai/aiProvider";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/getRecommendation";
import { ResponseCard } from "@/components/ai/ResponseCard";
import { EmptyState } from "@/components/states";

interface AskAIProps {
  /** Pre-fill the input with this question and submit immediately (used by ActionChips) */
  initialQuestion?: string | undefined;
  /** Called after the initialQuestion has been consumed so the parent can clear it */
  onInitialQuestionConsumed?: (() => void) | undefined;
}

export function AskAI({ initialQuestion, onInitialQuestionConsumed }: AskAIProps = {}) {
  const { turns, isLoading, ask, reset } = useChatSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  // Open panel and pre-fill + auto-submit from ActionChip click
  useEffect(() => {
    if (initialQuestion) {
      setOpen(true);
      setInput(initialQuestion);
      void submit(initialQuestion);
      onInitialQuestionConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Scroll thread to latest response
  useEffect(() => {
    if (threadRef.current && turns.length > 0) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turns]);

  const submit = async (q: string) => {
    if (!q.trim()) return;
    setInput("");
    await ask(q);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        id="ask-ai-trigger"
        className="fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_-18px_oklch(0_0_0/90%)] transition-transform hover:-translate-y-0.5"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3.5 13.7 8l4.5 1.7-4.5 1.7L12 16l-1.7-4.6L5.8 9.7 10.3 8 12 3.5ZM18.5 15l.8 2.1 2.2.9-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.9.8-2.1Z" />
        </svg>
        Ask AI
      </button>

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Ask AI">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close Ask AI"
            onClick={handleClose}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <div className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border bg-card">
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4">
              <div>
                <p className="eyebrow" style={{ color: "var(--color-ai)" }}>
                  {(() => {
                    const st = getActiveAIStatus();
                    if (st.provider === "gemini") return "Gemini 2.0 Flash · Evidence-based";
                    if (st.provider === "openai") return "GPT-4o-mini · Evidence-based";
                    return "Evidence-based assistant";
                  })()}
                </p>
                <h2 className="display-md mt-1">Ask about today</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {turns.length > 0
                    ? "Ask a follow-up — I remember this conversation."
                    : "Answers are grounded in your live environmental data."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {turns.length > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-border p-2 transition-colors hover:bg-surface"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conversation thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-5">
              {turns.length === 0 && !isLoading ? (
                <EmptyState
                  title="No question yet"
                  message="Pick a suggestion or type your own. Every answer is a structured decision grounded in real forecast data."
                />
              ) : (
                turns.map((turn, i) => (
                  <div key={i} className="space-y-3">
                    {/* User bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                        {turn.question}
                      </div>
                    </div>
                    {/* AI response card */}
                    <ResponseCard response={turn.response} isLoading={false} compact headline={turn.question} />
                  </div>
                ))
              )}

              {/* Loading state for the latest message */}
              {isLoading && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground opacity-60">
                      {input || "…"}
                    </div>
                  </div>
                  <div className="panel p-4 space-y-2">
                    <div className="skeleton h-3 w-3/4" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-5/6" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested questions (only when no turns yet) */}
            {turns.length === 0 && !isLoading && (
              <div className="shrink-0 border-t border-border px-4 pt-3 pb-2 flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void submit(q)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="shrink-0 border-t border-border p-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(input);
                }}
              >
                <label className="sr-only" htmlFor="ask-input">
                  Your question
                </label>
                <input
                  id="ask-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    turns.length > 0
                      ? "Ask a follow-up…"
                      : "Should I hold my event outside?"
                  }
                  disabled={isLoading}
                  className="flex-1 rounded-full border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-ring disabled:opacity-50"
                />
                <button
                  type="submit"
                  id="ask-ai-submit"
                  className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? "…" : "Ask"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
