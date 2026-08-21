import { useRecommendation } from "@/lib/ai/useRecommendation";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatRange, formatTemp } from "@/lib/env/format";
import { BasedOn, AiLabel, DataLabel, DecisionChain, VerdictBadge } from "@/components/ai/ResponseCard";
import { PanelSkeleton } from "@/components/states";

export function DailyBrief() {
  const { context, settings } = useEnvironment();
  const { data, isFetching } = useRecommendation("daily_brief");

  if (!context || !data || isFetching) return <PanelSkeleton lines={7} />;

  // "Best time to…" rows are Explore's job — the brief keeps only what is unique to it.
  const extras = Object.fromEntries(
    Object.entries((data.extras ?? {}) as Record<string, string>).filter(
      ([label]) => !label.toLowerCase().startsWith("best time"),
    ),
  );
  const c = context.current;

  return (
    <section aria-labelledby="daily-brief" className="panel rise-in overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-4 md:p-4">
        <div className="max-w-2xl">
          <AiLabel>Your day at a glance</AiLabel>
          <h2 id="daily-brief" className="display-md mt-1.5">
            {data.why}
          </h2>
        </div>
        <VerdictBadge verdict={data.recommendation} confidence={data.confidence} />
      </div>

      <div className="px-4 pb-4 md:px-4 md:pb-5">
        <DecisionChain
          data={`${formatTemp(c.temperature, settings)} · UV ${c.uvIndex.toFixed(0)} · ${Math.round(c.rainProbability)}% rain · ${Math.round(c.windSpeed)} km/h wind`}
          interpretation={data.mainConsideration}
          decision={`Best window: ${formatRange(data.bestTime, settings)}`}
        />
      </div>

      <div className="grid gap-px border-t border-border bg-border md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(extras).map(([label, value]) => (
          <div key={label} className="bg-card p-4">
            <DataLabel>{label}</DataLabel>
            <p className="mt-2 text-sm">{typeof value === "string" ? formatRange(value, settings) : value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pt-4 pb-4 md:px-4 md:pb-5">
        <p className="eyebrow mb-2">What to do</p>
        <ul className="grid gap-2 md:grid-cols-2">
          {data.whatToDo.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
        <BasedOn sources={data.dataUsed} />
      </div>
    </section>
  );
}
