import { useEffect, useMemo, useState } from "react";

import { getRecommendation } from "@/lib/ai/getRecommendation";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatRange } from "@/lib/env/format";
import type { EventDetails, StructuredResponse } from "@/lib/env/types";
import { AiLabel, BasedOn, RiskRow, VerdictBadge } from "@/components/ai/ResponseCard";
import { PanelSkeleton } from "@/components/states";

function tomorrow() {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
}

const PRESET: EventDetails = {
  name: "Summer Garden Party",
  date: tomorrow(),
  startTime: "14:00",
  endTime: "20:00",
  people: 80,
  outdoor: true,
  type: "Social",
};

const EVENT_TYPES = ["Social", "Wedding", "Corporate", "Sport", "Market"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-ring";

export function EventPlanner() {
  const { context, settings } = useEnvironment();
  const [details, setDetails] = useState<EventDetails>(PRESET);
  const [result, setResult] = useState<StructuredResponse | null>(null);
  const [baseline, setBaseline] = useState<{ score: number; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [altStart, setAltStart] = useState("10:00");
  const [altEnd, setAltEnd] = useState("16:00");
  const [comparison, setComparison] = useState<StructuredResponse | null>(null);
  const [comparing, setComparing] = useState(false);

  const ctxWithEvent = useMemo(
    () => (context ? { ...context, eventDetails: details } : undefined),
    [context, details],
  );

  const assess = async () => {
    if (!ctxWithEvent) return;
    setLoading(true);
    setComparison(null);
    const res = await getRecommendation("event_readiness", ctxWithEvent, { date: details.date });
    setResult(res);
    setBaseline({ score: res.score ?? 0, label: `${details.startTime}–${details.endTime}` });
    setLoading(false);
  };

  const compare = async () => {
    if (!ctxWithEvent) return;
    setComparing(true);
    const res = await getRecommendation("event_readiness", ctxWithEvent, {
      timeOverride: { start: altStart, end: altEnd },
      date: details.date,
    });
    setComparison(res);
    setComparing(false);
  };

  useEffect(() => {
    if (context && !result && !loading) void assess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  if (!context) return <PanelSkeleton lines={8} />;

  const delta = comparison && baseline ? (comparison.score ?? 0) - baseline.score : 0;

  return (
    <div className="space-y-4">
      <section aria-labelledby="event-inputs" className="panel p-4 md:p-4">
        <h2 id="event-inputs" className="display-md">
          Outdoor event readiness
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A preset is loaded so you can see the analysis immediately. Everything is editable.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Event name">
            <input
              className={inputClass}
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
            />
          </Field>
          <Field label="Location">
            <input className={inputClass} value={context.location.name} readOnly aria-readonly="true" />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className={inputClass}
              value={details.date}
              onChange={(e) => setDetails({ ...details, date: e.target.value })}
            />
          </Field>
          <Field label="Start time">
            <input
              type="time"
              className={inputClass}
              value={details.startTime}
              onChange={(e) => setDetails({ ...details, startTime: e.target.value })}
            />
          </Field>
          <Field label="End time">
            <input
              type="time"
              className={inputClass}
              value={details.endTime}
              onChange={(e) => setDetails({ ...details, endTime: e.target.value })}
            />
          </Field>
          <Field label="Number of people">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={details.people}
              onChange={(e) => setDetails({ ...details, people: Number(e.target.value) })}
            />
          </Field>
          <Field label="Event type">
            <select
              className={inputClass}
              value={details.type}
              onChange={(e) => setDetails({ ...details, type: e.target.value })}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Setting">
            <select
              className={inputClass}
              value={details.outdoor ? "Outdoor" : "Indoor"}
              onChange={(e) => setDetails({ ...details, outdoor: e.target.value === "Outdoor" })}
            >
              <option>Outdoor</option>
              <option>Indoor</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void assess()}
              className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {loading ? "Assessing…" : "Assess conditions"}
            </button>
          </div>
        </div>
      </section>

      {loading || !result ? (
        <PanelSkeleton lines={8} />
      ) : (
        <>
          <section aria-labelledby="readiness" className="panel rise-in overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-4">
              <div>
                <p className="eyebrow">Event readiness</p>
                <p className="numeric mt-1 text-6xl md:text-7xl">
                  {result.score}
                  <span className="text-xl text-muted-foreground">/100</span>
                </p>
                <p id="readiness" className="display-md mt-2">
                  {result.scoreLabel}
                </p>
              </div>
              <div className="space-y-3 text-right">
                <VerdictBadge verdict={result.recommendation} confidence={result.confidence} />
                <p className="text-sm text-muted-foreground">
                  Best window today: {formatRange(result.bestTime, settings)}
                </p>
              </div>
            </div>
            <div className="grid gap-px border-t border-border bg-border md:grid-cols-2">
              <div className="bg-card p-4">
                <p className="eyebrow mb-1">Risk categories</p>
                <div className="divide-y divide-border">
                  {result.risks.map((risk) => (
                    <RiskRow key={risk.name} {...risk} />
                  ))}
                </div>
              </div>
              <div className="bg-card p-4">
                <AiLabel>AI recommendations</AiLabel>
                <ul className="mt-3 space-y-2">
                  {result.whatToDo.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">{result.why}</p>
              </div>
            </div>
            <div className="border-t border-border p-4 md:p-4">
              <p className="eyebrow mb-3">Event preparation</p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {((result.extras?.["checklist"] as string[]) ?? []).map((item) => (
                  <li key={item} className="panel-quiet flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="h-4 w-4 rounded border border-border" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="eyebrow mt-4 mb-3">Clothing guidance</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {((result.extras?.["clothing"] as string[]) ?? []).map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
              <BasedOn sources={result.dataUsed} />
            </div>
          </section>

          <section aria-labelledby="compare" className="panel p-4 md:p-4">
            <h3 id="compare" className="display-md">
              What if you moved it?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Change the window and the analysis is rebuilt from the forecast for those exact hours.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <Field label="New start">
                <input type="time" className={inputClass} value={altStart} onChange={(e) => setAltStart(e.target.value)} />
              </Field>
              <Field label="New end">
                <input type="time" className={inputClass} value={altEnd} onChange={(e) => setAltEnd(e.target.value)} />
              </Field>
              <button
                type="button"
                onClick={() => void compare()}
                className="rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface"
              >
                {comparing ? "Reassessing…" : "Reassess event"}
              </button>
            </div>

            {comparison && baseline && (
              <div className="rise-in mt-4 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
                <div className="bg-card p-4">
                  <p className="eyebrow">Current · {baseline.label}</p>
                  <p className="numeric mt-2 text-xl">{baseline.score}/100</p>
                </div>
                <div className="bg-card p-4">
                  <p className="eyebrow">
                    Moved · {altStart}–{altEnd}
                  </p>
                  <p className="numeric mt-2 text-xl">{comparison.score}/100</p>
                </div>
                <div className="bg-card p-4">
                  <p className="eyebrow">Verdict</p>
                  <p
                    className="mt-2 text-lg font-medium"
                    style={{ color: delta > 6 ? "var(--color-good)" : delta < -6 ? "var(--color-bad)" : "var(--color-warn)" }}
                  >
                    {delta > 12 ? "MUCH BETTER" : delta > 4 ? "BETTER" : delta < -12 ? "MUCH WORSE" : delta < -4 ? "WORSE" : "ABOUT THE SAME"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {delta >= 0 ? "+" : ""}
                    {delta} points
                  </p>
                </div>
                <div className="bg-card p-4 md:col-span-3">
                  <AiLabel>Why the score changed</AiLabel>
                  <p className="mt-2 text-sm text-muted-foreground">{comparison.why}</p>
                  <ul className="mt-3 space-y-2">
                    {comparison.whatToDo.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <BasedOn sources={comparison.dataUsed} />
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
