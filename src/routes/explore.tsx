import { createFileRoute } from "@tanstack/react-router";

import { SectionNav, useSectionTabs } from "@/components/SectionNav";
import { useMemo } from "react";

import { PanelSkeleton } from "@/components/states";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatDistance, formatRange, formatSpeed, formatTime } from "@/lib/env/format";
import { bestWindow } from "@/lib/ai/reasoning";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore your environment — Acclimate" },
      {
        name: "description",
        content:
          "Best times today for outdoors, exercise, photography, sunset, family activities and stargazing, plus a visual read of your local environment.",
      },
      { property: "og:title", content: "Explore your environment — Acclimate" },
      {
        property: "og:description",
        content: "Best-time windows and an at-a-glance view of air, sun, wind and moon where you are.",
      },
    ],
  }),
  component: ExplorePage,
});

const CARDS = [
  { title: "Outdoors", key: "outdoors", length: 3, note: "General time outside" },
  { title: "Exercise", key: "exercise", length: 2, note: "Lowest heat and UV load" },
  { title: "Photography", key: "photography", length: 2, note: "Softest available light" },
  { title: "Sunset", key: "sunset", length: 1, note: "Horizon and colour" },
  { title: "Family activities", key: "family", length: 3, note: "Comfortable for all ages" },
  { title: "Stargazing", key: "stargazing", length: 3, note: "Cloud cover permitting" },
] as const;

const SECTIONS = [
  { id: "best-times", label: "Best times" },
  { id: "your-env", label: "Your environment" },
];

function ExplorePage() {
  const { context, settings } = useEnvironment();
  const { active, setActive } = useSectionTabs(SECTIONS);

  const windows = useMemo(
    () => (context ? CARDS.map((c) => ({ ...c, win: bestWindow(context, c.key, c.length) })) : []),
    [context],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 md:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow">Explore</p>
        <h1 className="display-lg mt-2">Best times today</h1>
        <p className="mt-3 text-muted-foreground">
          Windows ranked from the live hourly forecast for {context?.location.name ?? "your location"}.
        </p>
      </header>

      <SectionNav items={SECTIONS} active={active} onChange={setActive} />

      {!context ? (
        <PanelSkeleton lines={8} />
      ) : (
        <>
          {active === "best-times" && <section
            id="best-times"
            aria-label="Best times"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {windows.map((card) => (
              <article key={card.title} className="panel p-4">
                <p className="eyebrow">{card.title}</p>
                <p className="numeric mt-2 text-xl">{formatRange(card.win.label, settings)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-strong">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${card.win.score}%`,
                      background:
                        card.win.score >= 70
                          ? "var(--color-good)"
                          : card.win.score >= 45
                            ? "var(--color-warn)"
                            : "var(--color-bad)",
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Suitability {card.win.score}/100</p>
              </article>
            ))}
          </section>

          {active === "your-env" && <section id="your-env" aria-labelledby="your-env-h" className="panel overflow-hidden">
            <div className="border-b border-border p-4">
              <h2 id="your-env-h" className="display-md">
                Your environment
              </h2>
            </div>
            <dl className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  k: "Air quality",
                  v: context.airQuality.available ? (context.airQuality.aqiLabel ?? "—") : "Unavailable",
                  n: context.airQuality.available
                    ? `PM2.5 ${context.airQuality.measurements.find((m) => m.parameter === "PM2.5")?.value.toFixed(1)} µg/m³`
                    : "No nearby station data",
                },
                { k: "Weather", v: context.current.description, n: `${Math.round(context.current.cloudCover)}% cloud` },
                { k: "UV", v: context.current.uvIndex.toFixed(1), n: context.current.uvIndex >= 6 ? "Protection advised" : "Low exposure" },
                { k: "Wind", v: formatSpeed(context.current.windSpeed, settings), n: `Gusts ${formatSpeed(context.current.windGusts, settings)}` },
                { k: "Visibility", v: formatDistance(context.current.visibility, settings), n: context.current.visibility < 6 ? "Reduced" : "Clear" },
                { k: "Sunrise", v: formatTime(context.sun.sunrise, settings), n: context.sun.dawn ? `Dawn ${formatTime(context.sun.dawn, settings)}` : context.sun.source },
                { k: "Sunset", v: formatTime(context.sun.sunset, settings), n: context.sun.goldenHour ? `Golden hour ${formatTime(context.sun.goldenHour, settings)}` : context.sun.source },
                { k: "Moon", v: context.moon.phase ?? "—", n: `${context.moon.illumination ?? 0}% illuminated` },
              ].map((item) => (
                <div key={item.k} className="bg-card p-4">
                  <dt className="eyebrow">{item.k}</dt>
                  <dd className="numeric mt-2 text-lg">{item.v}</dd>
                  <p className="mt-1 text-xs text-muted-foreground">{item.n}</p>
                </div>
              ))}
            </dl>
            <p className="eyebrow p-4">Sources: {context.sources.join(" · ")}</p>
          </section>
        </>
      )}
    </div>
  );
}
