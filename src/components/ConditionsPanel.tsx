import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatDistance, formatSpeed, formatTemp } from "@/lib/env/format";
import { PanelSkeleton } from "@/components/states";

function Metric({
  label,
  value,
  note,
  ratio,
}: {
  label: string;
  value: string;
  note?: string;
  ratio?: number;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 p-4">
      <p className="eyebrow">{label}</p>
      <div>
        <p className="numeric text-xl">{value}</p>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>
      {typeof ratio === "number" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-strong">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${Math.max(4, Math.min(100, ratio * 100))}%`,
              background: "linear-gradient(90deg, var(--color-data), var(--color-primary))",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ConditionsPanel() {
  const { context, settings } = useEnvironment();
  if (!context) return <PanelSkeleton lines={5} />;
  const c = context.current;
  const aq = context.airQuality;

  return (
    <section aria-labelledby="outside-now" className="panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border p-4">
        <h2 id="outside-now" className="display-md">
          Outside right now
        </h2>
        <p className="eyebrow">{c.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
        <div className="bg-card">
          <Metric
            label="Temperature"
            value={formatTemp(c.temperature, settings)}
            note={`Feels like ${formatTemp(c.feelsLike, settings)}`}
            ratio={(c.temperature + 10) / 50}
          />
        </div>
        <div className="bg-card">
          <Metric label="Humidity" value={`${Math.round(c.humidity)}%`} ratio={c.humidity / 100} />
        </div>
        <div className="bg-card">
          <Metric
            label="Wind"
            value={formatSpeed(c.windSpeed, settings)}
            note={`Gusts ${formatSpeed(c.windGusts, settings)}`}
            ratio={c.windSpeed / 60}
          />
        </div>
        <div className="bg-card">
          <Metric
            label="Rain"
            value={`${Math.round(c.rainProbability)}%`}
            note={`${c.precipitation.toFixed(1)} mm now`}
            ratio={c.rainProbability / 100}
          />
        </div>
        <div className="bg-card">
          <Metric
            label="UV index"
            value={c.uvIndex.toFixed(1)}
            note={c.uvIndex >= 8 ? "Very high" : c.uvIndex >= 6 ? "High" : c.uvIndex >= 3 ? "Moderate" : "Low"}
            ratio={c.uvIndex / 11}
          />
        </div>
        <div className="bg-card">
          {aq.available ? (
            <Metric
              label="Air quality"
              value={aq.aqiLabel ?? "—"}
              note={`PM2.5 ${aq.measurements.find((m) => m.parameter === "PM2.5")?.value.toFixed(1) ?? "—"} µg/m³`}
              ratio={(aq.aqiScore ?? 0) / 100}
            />
          ) : (
            <Metric label="Air quality" value="Unavailable" note="No nearby station data" />
          )}
        </div>
        <div className="bg-card">
          <Metric
            label="Visibility"
            value={formatDistance(c.visibility, settings)}
            ratio={Math.min(1, c.visibility / 30)}
          />
        </div>
        <div className="bg-card">
          <Metric label="Cloud cover" value={`${Math.round(c.cloudCover)}%`} ratio={c.cloudCover / 100} />
        </div>
      </div>
    </section>
  );
}
