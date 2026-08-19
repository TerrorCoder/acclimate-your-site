import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatDistance, formatSpeed, formatTemp } from "@/lib/env/format";
import { PanelSkeleton } from "@/components/states";
import { Disclosure } from "@/components/Disclosure";

const ICONS: Record<string, string> = {
  temp: "M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z",
  drop: "M12 3.5c3 3.6 5 6.3 5 8.8a5 5 0 0 1-10 0c0-2.5 2-5.2 5-8.8Z",
  wind: "M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8",
  sun: "M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5m0-14.2-1.5 1.5M6.4 17.6l-1.5 1.5",
  leaf: "M20 4C10 4 4 9 4 16c0 2 .7 3.4.7 3.4S9 10 19 8c0 0-5.5 2.6-8.6 7.8-1 1.7-1.6 3.4-1.9 4.6 8-.4 11.5-6.4 11.5-16.4Z",
  eye: "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Zm10 2.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  cloud: "M7 18h9.5a3.5 3.5 0 0 0 .3-7A5.5 5.5 0 0 0 6.5 12 3 3 0 0 0 7 18Z",
};

type Gauge = {
  key: string;
  icon: string;
  label: string;
  word: string;
  ratio: number;
  tone: "good" | "warn" | "bad";
};

function tone(t: Gauge["tone"]) {
  return `var(--color-${t === "good" ? "good" : t === "warn" ? "warn" : "bad"})`;
}

function GaugeChip({ gauge }: { gauge: Gauge }) {
  const color = tone(gauge.tone);
  return (
    <li className="flex min-w-[8.5rem] snap-start flex-col gap-2 bg-card px-3.5 py-3 sm:min-w-0">
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          style={{ color }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={gauge.icon} />
        </svg>
        <span className="eyebrow truncate">{gauge.label}</span>
      </div>
      <span className="text-sm font-medium">{gauge.word}</span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-strong">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.max(4, Math.min(100, gauge.ratio * 100))}%`, background: color }}
        />
      </div>
    </li>
  );
}

export function ConditionsPanel() {
  const { context, settings } = useEnvironment();
  if (!context) return <PanelSkeleton lines={4} />;
  const c = context.current;
  const aq = context.airQuality;

  const gauges: Gauge[] = [
    {
      key: "temp",
      icon: ICONS["temp"]!,
      label: "Feels like",
      word: formatTemp(c.feelsLike, settings),
      ratio: (c.feelsLike + 10) / 50,
      tone: c.feelsLike >= 31 || c.feelsLike <= 2 ? "bad" : c.feelsLike >= 27 || c.feelsLike <= 8 ? "warn" : "good",
    },
    {
      key: "rain",
      icon: ICONS["drop"]!,
      label: "Rain",
      word: c.rainProbability >= 60 ? "Likely" : c.rainProbability >= 30 ? "Possible" : "Unlikely",
      ratio: c.rainProbability / 100,
      tone: c.rainProbability >= 60 ? "bad" : c.rainProbability >= 30 ? "warn" : "good",
    },
    {
      key: "wind",
      icon: ICONS["wind"]!,
      label: "Wind",
      word: c.windSpeed >= 35 ? "Strong" : c.windSpeed >= 18 ? "Breezy" : "Calm",
      ratio: c.windSpeed / 60,
      tone: c.windSpeed >= 35 ? "bad" : c.windSpeed >= 18 ? "warn" : "good",
    },
    {
      key: "uv",
      icon: ICONS["sun"]!,
      label: "UV",
      word: c.uvIndex >= 8 ? "Very high" : c.uvIndex >= 6 ? "High" : c.uvIndex >= 3 ? "Moderate" : "Low",
      ratio: c.uvIndex / 11,
      tone: c.uvIndex >= 8 ? "bad" : c.uvIndex >= 6 ? "warn" : "good",
    },
    {
      key: "air",
      icon: ICONS["leaf"]!,
      label: "Air",
      word: aq.available ? (aq.aqiLabel ?? "—") : "No data",
      ratio: (aq.aqiScore ?? 20) / 100,
      tone: !aq.available ? "warn" : (aq.aqiScore ?? 0) >= 60 ? "bad" : (aq.aqiScore ?? 0) >= 35 ? "warn" : "good",
    },
    {
      key: "cloud",
      icon: ICONS["cloud"]!,
      label: "Sky",
      word: c.cloudCover >= 70 ? "Overcast" : c.cloudCover >= 30 ? "Part cloud" : "Clear",
      ratio: c.cloudCover / 100,
      tone: "good",
    },
  ];

  return (
    <section aria-labelledby="outside-now" className="panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-4 pt-3.5 pb-3">
        <h2 id="outside-now" className="display-md">
          Outside right now
        </h2>
        <p className="eyebrow">{c.description}</p>
      </div>

      <ul className="flex snap-x gap-px overflow-x-auto border-y border-border bg-border sm:grid sm:grid-cols-3 lg:grid-cols-6">
        {gauges.map((g) => (
          <GaugeChip key={g.key} gauge={g} />
        ))}
      </ul>

      <div className="p-4">
        <Disclosure summary="Show the numbers">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
            {[
              ["Temperature", formatTemp(c.temperature, settings)],
              ["Feels like", formatTemp(c.feelsLike, settings)],
              ["Humidity", `${Math.round(c.humidity)}%`],
              ["Wind", formatSpeed(c.windSpeed, settings)],
              ["Gusts", formatSpeed(c.windGusts, settings)],
              ["Rain chance", `${Math.round(c.rainProbability)}%`],
              ["Precipitation", `${c.precipitation.toFixed(1)} mm`],
              ["UV index", c.uvIndex.toFixed(1)],
              [
                "PM2.5",
                aq.available
                  ? `${aq.measurements.find((m) => m.parameter === "PM2.5")?.value.toFixed(1) ?? "—"} µg/m³`
                  : "—",
              ],
              ["Visibility", formatDistance(c.visibility, settings)],
              ["Cloud cover", `${Math.round(c.cloudCover)}%`],
              ["Sunset", context.sun.sunset.slice(0, 5)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border pb-1.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="numeric">{v}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      </div>
    </section>
  );
}
