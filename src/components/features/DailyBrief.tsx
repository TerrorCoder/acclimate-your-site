import { useRecommendation } from "@/lib/ai/useRecommendation";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatRange, formatTemp } from "@/lib/env/format";
import { BasedOn, AiLabel, DataLabel, DecisionChain, VerdictBadge } from "@/components/ai/ResponseCard";
import { PanelSkeleton } from "@/components/states";
import { Disclosure } from "@/components/Disclosure";

export function DailyBrief() {
  const { context, settings } = useEnvironment();
  const { data, isFetching } = useRecommendation("daily_brief");

  if (!context || !data || isFetching) return <PanelSkeleton lines={5} />;

  const extras = (data.extras ?? {}) as Record<string, string>;
  const c = context.current;

  return (
    <section aria-labelledby="daily-brief" className="panel rise-in overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 max-w-2xl">
          <AiLabel>Your day at a glance</AiLabel>
          <h2 id="daily-brief" className="display-md mt-1.5">
            {data.why}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {data.mainConsideration} · best window {formatRange(data.bestTime, settings)}
          </p>
        </div>
        <VerdictBadge verdict={data.recommendation} confidence={data.confidence} />
      </div>

      <div className="px-4 pb-4">
        <ul className="grid gap-1.5 md:grid-cols-2">
          {data.whatToDo.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2.5 text-sm">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>

        <Disclosure summary="Show the reasoning and data" className="mt-3">
          <DecisionChain
            data={`${formatTemp(c.temperature, settings)} · UV ${c.uvIndex.toFixed(0)} · ${Math.round(c.rainProbability)}% rain · ${Math.round(c.windSpeed)} km/h wind`}
            interpretation={data.mainConsideration}
            decision={`Best window: ${formatRange(data.bestTime, settings)}`}
          />

          {Object.keys(extras).length > 0 && (
            <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(extras).map(([label, value]) => (
                <div key={label} className="bg-card p-3">
                  <DataLabel>{label}</DataLabel>
                  <p className="mt-1.5 text-sm">{typeof value === "string" ? formatRange(value, settings) : value}</p>
                </div>
              ))}
            </div>
          )}

          {data.whatToDo.length > 3 && (
            <ul className="mt-3 grid gap-1.5 md:grid-cols-2">
              {data.whatToDo.slice(3).map((item) => (
                <li key={item} className="flex gap-2.5 text-sm">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          <BasedOn sources={data.dataUsed} />
        </Disclosure>
      </div>
    </section>
  );
}
