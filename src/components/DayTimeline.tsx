import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatTemp, formatTime } from "@/lib/env/format";
import { PanelSkeleton } from "@/components/states";
import { Disclosure } from "@/components/Disclosure";
import type { HourPoint } from "@/lib/env/types";

function interpret(h: HourPoint, prev?: HourPoint): string {
  if (h.rainProbability >= 60) return "High rain risk";
  if (h.rainProbability >= 35 && (prev?.rainProbability ?? 0) < h.rainProbability) return "Rain building";
  if (h.uvIndex >= 8) return "Peak UV — seek shade";
  if (h.feelsLike >= 31) return "Hottest stretch";
  if (!h.isDay) return "After dark — cooling";
  if (h.windGusts >= 38) return "Gusty";
  if (h.feelsLike <= 8) return "Cold — layer up";
  return "Comfortable";
}

function toneFor(h: HourPoint): string {
  if (h.rainProbability >= 60 || h.uvIndex >= 8 || h.feelsLike >= 31 || h.windGusts >= 45) return "var(--color-bad)";
  if (h.rainProbability >= 30 || h.uvIndex >= 6 || h.feelsLike <= 8 || h.windGusts >= 30) return "var(--color-warn)";
  return "var(--color-good)";
}

export function DayTimeline() {
  const { context, settings } = useEnvironment();
  if (!context) return <PanelSkeleton lines={4} />;

  const hours = context.todayHours.filter((h) => h.hour % 2 === 0);
  const now = Number(context.time.slice(0, 2));

  return (
    <section aria-labelledby="timeline" className="panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-4 pt-3.5 pb-3">
        <h2 id="timeline" className="display-md">
          How the day moves
        </h2>
        <p className="eyebrow">Swipe · hourly</p>
      </div>

      <ol className="flex snap-x gap-2 overflow-x-auto border-y border-border px-4 py-3">
        {hours.map((h) => {
          const active = now >= h.hour && now < h.hour + 2;
          const color = toneFor(h);
          return (
            <li
              key={h.hour}
              className="flex w-16 shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl py-2"
              style={
                active
                  ? { background: "color-mix(in oklab, var(--color-primary) 12%, transparent)" }
                  : undefined
              }
              title={`${formatTime(h.label, settings)} · ${interpret(h)}`}
            >
              <span className="eyebrow">{formatTime(h.label, settings)}</span>
              <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
              <div className="flex h-14 w-1.5 items-end overflow-hidden rounded-full bg-surface-strong" aria-hidden="true">
                <div
                  className="w-full rounded-full"
                  style={{ height: `${Math.max(6, h.rainProbability)}%`, background: "var(--color-data)" }}
                />
              </div>
              <span className="numeric text-xs">{formatTemp(h.temperature, settings, false)}</span>
            </li>
          );
        })}
      </ol>

      <div className="p-4">
        <Disclosure summary="Show the hour-by-hour numbers">
          <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {hours.map((h, i) => (
              <li key={h.hour} className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                <span className="numeric text-muted-foreground">{formatTime(h.label, settings)}</span>
                <span className="numeric">
                  {formatTemp(h.temperature, settings, false)} · {Math.round(h.rainProbability)}% · UV{" "}
                  {h.uvIndex.toFixed(0)}
                </span>
                <span className="truncate text-xs" style={{ color: "var(--color-ai)" }}>
                  {interpret(h, hours[i - 1])}
                </span>
              </li>
            ))}
          </ul>
        </Disclosure>
      </div>
    </section>
  );
}
