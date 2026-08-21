import { createFileRoute } from "@tanstack/react-router";

import { AiLabel, BasedOn } from "@/components/ai/ResponseCard";
import { ActionChips } from "@/components/ai/ActionChips";
import { PanelSkeleton } from "@/components/states";
import { useRecommendation } from "@/lib/ai/useRecommendation";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatTemp } from "@/lib/env/format";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Weekly outlook & insights — Acclimate" },
      {
        name: "description",
        content:
          "A seven-day environmental outlook with temperature and rain trends, outdoor suitability, and concise insights derived from the actual forecast.",
      },
      { property: "og:title", content: "Weekly outlook & insights — Acclimate" },
      {
        property: "og:description",
        content: "How conditions move across the week, and which day is genuinely the best one to be outside.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { context, settings } = useEnvironment();
  const { data, isFetching } = useRecommendation("insight");

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 md:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow">Insights</p>
        <h1 className="display-lg mt-2">The week ahead, read for you</h1>
        <p className="mt-3 text-muted-foreground">
          Seven days of Open-Meteo forecast data, reasoned across time rather than listed.
        </p>
      </header>

      {!context ? (
        <PanelSkeleton lines={8} />
      ) : (
        <section aria-labelledby="weekly" className="panel overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 id="weekly" className="display-md">
              Weekly outlook
            </h2>
          </div>
          <ol className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {context.daily.map((day) => {
              const suitability = Math.max(
                0,
                Math.min(100, Math.round(100 - day.rainProbability * 0.5 - Math.abs(day.tempMax - 24) * 2)),
              );
              return (
                <li key={day.date} className="bg-card p-4">
                  <p className="eyebrow">{day.weekday}</p>
                  <p className="numeric mt-2 text-xl">{formatTemp(day.tempMax, settings, false)}</p>
                  <p className="numeric text-sm text-muted-foreground">
                    {formatTemp(day.tempMin, settings, false)} low
                  </p>
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-strong">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(3, day.rainProbability)}%`, background: "var(--color-data)" }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{Math.round(day.rainProbability)}% rain</p>
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-strong">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${suitability}%`,
                        background: suitability >= 70 ? "var(--color-good)" : suitability >= 45 ? "var(--color-warn)" : "var(--color-bad)",
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">Outdoor suitability {suitability}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section aria-labelledby="ai-insights" className="panel p-4 md:p-4">
        <AiLabel>AI insights</AiLabel>
        <h2 id="ai-insights" className="display-md mt-1">
          What the week actually means
        </h2>
        {isFetching || !data ? (
          <div className="mt-4 space-y-3">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-10/12" />
            <div className="skeleton h-3 w-9/12" />
          </div>
        ) : (
          <>
            <ol className="mt-3 space-y-4">
              {data.whatToDo.map((item, i) => (
                <li key={item} className="flex gap-4">
                  <span className="numeric text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm">{item}</p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">{data.why}</p>
            <BasedOn sources={data.dataUsed} />
          </>
        )}
      </section>

      <ActionChips domain="weekly" />
    </div>
  );
}
