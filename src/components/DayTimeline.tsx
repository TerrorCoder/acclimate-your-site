import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatTemp, formatTime } from "@/lib/env/format";
import { PanelSkeleton } from "@/components/states";
import type { HourPoint } from "@/lib/env/types";

function interpret(h: HourPoint, prev?: HourPoint): string {
  if (h.rainProbability >= 60) return "High rain risk";
  if (h.rainProbability >= 35 && (prev?.rainProbability ?? 0) < h.rainProbability) return "Increasing rain risk";
  if (h.uvIndex >= 8) return "Peak UV — seek shade";
  if (h.feelsLike >= 31) return "Hottest part of the day";
  if (!h.isDay) return "After dark — cooling";
  if (h.windGusts >= 38) return "Gusty conditions";
  if (h.feelsLike <= 8) return "Cold — layer up";
  return "Comfortable window";
}

export function DayTimeline() {
  const { context, settings } = useEnvironment();
  if (!context) return <PanelSkeleton lines={5} />;

  const targets = [6, 9, 12, 15, 18, 21];
  const blocks = targets
    .map((t) => context.todayHours.find((h) => h.hour === t))
    .filter((h): h is HourPoint => Boolean(h));
  const now = Number(context.time.slice(0, 2));

  return (
    <section aria-labelledby="timeline" className="panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border p-6">
        <h2 id="timeline" className="display-md">
          How the day moves
        </h2>
        <p className="eyebrow">Hourly · Open-Meteo</p>
      </div>
      <ol className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {blocks.map((h, i) => {
          const active = now >= h.hour && now < h.hour + 3;
          return (
            <li
              key={h.hour}
              className="flex flex-col gap-3 bg-card p-5"
              style={active ? { background: "color-mix(in oklab, var(--color-card) 70%, var(--color-primary) 8%)" } : undefined}
            >
              <p className="numeric text-sm text-muted-foreground">{formatTime(h.label, settings)}</p>
              <p className="numeric text-3xl">{formatTemp(h.temperature, settings, false)}</p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(3, h.rainProbability)}%`,
                    background: "var(--color-data)",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{Math.round(h.rainProbability)}% rain · UV {h.uvIndex.toFixed(0)}</p>
              <p className="mt-auto text-sm" style={{ color: "var(--color-ai)" }}>
                {interpret(h, blocks[i - 1])}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
