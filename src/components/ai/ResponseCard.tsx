import { useState, type ReactNode } from "react";

import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatRange } from "@/lib/env/format";
import type { Level, StructuredResponse, Verdict } from "@/lib/env/types";
import { PanelSkeleton } from "@/components/states";

const VERDICT_COLOR: Record<Verdict, string> = {
  GO: "var(--color-good)",
  CAUTION: "var(--color-warn)",
  WAIT: "var(--color-warn)",
  AVOID: "var(--color-bad)",
};

const LEVEL_COLOR: Record<Level, string> = {
  Low: "var(--color-good)",
  Medium: "var(--color-warn)",
  High: "var(--color-bad)",
};

export function VerdictBadge({ verdict, confidence }: { verdict: Verdict; confidence?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
      style={{ borderColor: VERDICT_COLOR[verdict], color: VERDICT_COLOR[verdict] }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: VERDICT_COLOR[verdict] }} />
      {verdict}
      {confidence && <span className="font-normal text-muted-foreground">· {confidence} confidence</span>}
    </span>
  );
}

export function RiskRow({ name, level, reason }: { name: string; level: Level; reason: string }) {
  const steps = level === "High" ? 3 : level === "Medium" ? 2 : 1;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-1 flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-4 rounded-full"
            style={{ background: i < steps ? LEVEL_COLOR[level] : "var(--color-surface-strong)" }}
          />
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {name} <span className="text-muted-foreground">· {level}</span>
        </p>
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
    </div>
  );
}

export function BasedOn({ sources }: { sources: string[] }) {
  return (
    <p className="eyebrow mt-3 border-t border-border pt-3">
      Based on: <span className="text-foreground/70">{sources.join(" · ")}</span>
    </p>
  );
}

export function AiLabel({ children = "AI interpretation" }: { children?: ReactNode }) {
  return (
    <span className="eyebrow" style={{ color: "var(--color-ai)" }}>
      {children}
    </span>
  );
}

export function DataLabel({ children = "Data" }: { children?: ReactNode }) {
  return (
    <span className="eyebrow" style={{ color: "var(--color-data)" }}>
      {children}
    </span>
  );
}

/** DATA → AI INTERPRETATION → DECISION, the product's recurring visual language. */
export function DecisionChain({
  data,
  interpretation,
  decision,
}: {
  data: string;
  interpretation: string;
  decision: string;
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
      {[
        { label: <DataLabel />, body: data, mono: true },
        { label: <AiLabel />, body: interpretation, mono: false },
        { label: <span className="eyebrow text-foreground">Decision</span>, body: decision, mono: false },
      ].map((cell, i) => (
        <div key={i} className="bg-card p-4">
          {cell.label}
          <p className={`mt-2 text-sm ${cell.mono ? "numeric" : ""} ${i === 2 ? "font-medium" : ""}`}>{cell.body}</p>
        </div>
      ))}
    </div>
  );
}

export function ResponseCard({
  response,
  isLoading,
  compact = false,
  headline,
}: {
  response?: StructuredResponse | undefined;
  isLoading?: boolean;
  compact?: boolean;
  headline?: string;
}) {
  const { settings } = useEnvironment();
  const [showWhy, setShowWhy] = useState(!compact);

  if (isLoading || !response) return <PanelSkeleton lines={compact ? 3 : 6} />;

  return (
    <article className="panel rise-in p-4 md:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <AiLabel>
            {headline ?? response.title ?? "AI recommendation"}
            {response.aiPowered && (
              <span className="ml-1.5 opacity-75 font-normal">
                · {response.aiProvider === "gemini" ? "Gemini" : response.aiProvider === "openai" ? "GPT-4o-mini" : "Live AI"}
              </span>
            )}
          </AiLabel>
          <p className="display-md mt-1">{response.mainConsideration}</p>
        </div>
        <VerdictBadge verdict={response.recommendation} confidence={response.confidence} />
      </header>

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <p className="eyebrow">Best time</p>
          <p className="numeric text-lg">{formatRange(response.bestTime, settings)}</p>
        </div>
        {typeof response.score === "number" && (
          <div>
            <p className="eyebrow">Score</p>
            <p className="numeric text-lg">{response.score}/100</p>
          </div>
        )}
        {response.scoreLabel && (
          <div className="min-w-0">
            <p className="eyebrow">Assessment</p>
            <p className="text-sm">{response.scoreLabel}</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">What to do</p>
          <ul className="space-y-2">
            {response.whatToDo.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-1">Risks</p>
          <div className="divide-y divide-border">
            {response.risks.map((risk) => (
              <RiskRow key={risk.name} {...risk} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="text-sm font-medium underline-offset-4 hover:underline"
          aria-expanded={showWhy}
        >
          Why?
        </button>
        {showWhy && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{response.why}</p>}
      </div>

      <BasedOn sources={response.dataUsed} />
    </article>
  );
}
