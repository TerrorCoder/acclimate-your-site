import { createFileRoute } from "@tanstack/react-router";

import { LocationSelector } from "@/components/LocationSelector";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Acclimate" },
      {
        name: "description",
        content: "Choose your location, temperature units, measurement units and time format. Nothing else to configure.",
      },
      { property: "og:title", content: "Settings — Acclimate" },
      { property: "og:description", content: "Location, units and time format for Acclimate." },
    ],
  }),
  component: SettingsPage,
});

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-border p-1" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="rounded-full px-4 py-1.5 text-sm transition-colors"
          style={
            value === o.value
              ? { background: "var(--color-primary)", color: "var(--color-primary-foreground)" }
              : { color: "var(--color-muted-foreground)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPage() {
  const { settings, updateSettings, context } = useEnvironment();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <header>
        <p className="eyebrow">Settings</p>
        <h1 className="display-lg mt-2">Preferences</h1>
        <p className="mt-3 text-muted-foreground">
          Deliberately minimal — no accounts, no notifications, no profiles.
        </p>
      </header>

      <div className="panel mt-8 px-6 py-2 md:px-8">
        <Row label="Location" description={context ? `${context.location.name} · ${context.timezone}` : "Choose where to interpret conditions"}>
          <LocationSelector />
        </Row>
        <Row label="Temperature units" description="Used everywhere temperatures appear">
          <Toggle
            value={settings.tempUnit}
            onChange={(v) => updateSettings({ tempUnit: v })}
            options={[
              { value: "C", label: "Celsius" },
              { value: "F", label: "Fahrenheit" },
            ]}
          />
        </Row>
        <Row label="Measurement units" description="Wind speed and visibility">
          <Toggle
            value={settings.units}
            onChange={(v) => updateSettings({ units: v })}
            options={[
              { value: "metric", label: "Metric" },
              { value: "imperial", label: "Imperial" },
            ]}
          />
        </Row>
        <Row label="Time format" description="Times and best-time windows">
          <Toggle
            value={settings.timeFormat}
            onChange={(v) => updateSettings({ timeFormat: v })}
            options={[
              { value: "24h", label: "24 hour" },
              { value: "12h", label: "12 hour" },
            ]}
          />
        </Row>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Preferences are stored locally in your browser only.
      </p>
    </div>
  );
}
