import { createFileRoute } from "@tanstack/react-router";

import { SectionNav, SectionPanel, useSectionTabs } from "@/components/SectionNav";

import { ActivityGrid } from "@/components/ActivityGrid";
import { ConditionsPanel } from "@/components/ConditionsPanel";
import { DayTimeline } from "@/components/DayTimeline";
import { AiLabel, DataLabel } from "@/components/ai/ResponseCard";
import { ActionChips } from "@/components/ai/ActionChips";
import { DailyBrief } from "@/components/features/DailyBrief";
import { FoodCard } from "@/components/features/FoodCard";
import { OutfitPlanner } from "@/components/features/OutfitPlanner";
import { PanelSkeleton } from "@/components/states";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatSpeed, formatTemp } from "@/lib/env/format";
import type { HourPoint, NormalizedContext } from "@/lib/env/types";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Today, interpreted — Acclimate" },
      {
        name: "description",
        content:
          "Your daily brief, what you can do, live conditions, an hour-by-hour timeline and what to wear and eat — all built from live data.",
      },
      { property: "og:title", content: "Today, interpreted — Acclimate" },
      {
        property: "og:description",
        content:
          "A full-day environmental read-out with AI interpretation and a preparation checklist.",
      },
    ],
  }),
  component: TodayPage,
});

const PARTS: { name: string; from: number; to: number }[] = [
  { name: "Morning", from: 6, to: 12 },
  { name: "Afternoon", from: 12, to: 17 },
  { name: "Evening", from: 17, to: 21 },
  { name: "Night", from: 21, to: 24 },
];

function summarise(hours: HourPoint[], ctx: NormalizedContext): string {
  if (!hours.length) return "No forecast hours remain in this part of the day.";
  const rain = Math.max(...hours.map((h) => h.rainProbability));
  const feels = Math.max(...hours.map((h) => h.feelsLike));
  const uv = Math.max(...hours.map((h) => h.uvIndex));
  const wind = Math.max(...hours.map((h) => h.windGusts));
  if (rain >= 55)
    return `Rain is the dominant factor — probability reaches ${Math.round(rain)}%. Keep plans covered or flexible.`;
  if (feels >= 31)
    return `Heat dominates, peaking near ${Math.round(feels)}°C feels-like. Shade and hydration matter more than anything else.`;
  if (uv >= 8)
    return `UV peaks at ${uv.toFixed(0)} — short exposures are fine, extended time outside needs protection.`;
  if (wind >= 38)
    return `Gusts up to ${Math.round(wind)} km/h will make light setups and open water uncomfortable.`;
  if (!hours[0]?.isDay)
    return `Cool and settled after dark, easing to ${Math.round(Math.min(...hours.map((h) => h.feelsLike)))}°C. ${ctx.moon.phase} at ${ctx.moon.illumination}% illumination.`;
  return `Comfortable and stable — around ${Math.round(hours[0]!.feelsLike)}°C with ${Math.round(rain)}% peak rain probability. This is usable time.`;
}

const SECTIONS = [
  { id: "brief", label: "Daily brief" },
  { id: "activities", label: "Activities" },
  { id: "conditions", label: "Conditions" },
  { id: "timeline", label: "Timeline" },
  { id: "outfit", label: "Outfit & food" },
];

function TodayPage() {
  const { context, settings } = useEnvironment();
  const { active, setActive } = useSectionTabs(SECTIONS);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 md:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow">Today</p>
        <h1 className="display-lg mt-1.5">
          {context ? `${context.location.name}, hour by hour` : "Loading your day"}
        </h1>
      </header>

      <SectionNav items={SECTIONS} active={active} onChange={setActive} />

      <SectionPanel id="brief" active={active} className="space-y-4">
        <DailyBrief />
        <ActionChips domain="daily_brief" />
      </SectionPanel>

      <SectionPanel id="activities" active={active}>
        <ActivityGrid />
      </SectionPanel>

      <SectionPanel id="conditions" active={active} className="space-y-4">
        <ConditionsPanel />
        {!context ? (
          <PanelSkeleton lines={8} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {PARTS.map((part) => {
              const hours = context.todayHours.filter(
                (h) => h.hour >= part.from && h.hour < part.to,
              );
              const pick = hours[Math.floor(hours.length / 2)];
              return (
                <article
                  key={part.name}
                  className="panel grid gap-px overflow-hidden bg-border md:grid-cols-2"
                >
                  <div className="bg-card p-4">
                    <DataLabel>{part.name} · data</DataLabel>
                    <dl className="mt-3 space-y-2 text-sm">
                      {[
                        ["Temperature", pick ? formatTemp(pick.temperature, settings) : "—"],
                        [
                          "Rain",
                          pick
                            ? `${Math.round(Math.max(...hours.map((h) => h.rainProbability)))}%`
                            : "—",
                        ],
                        ["Wind", pick ? formatSpeed(pick.windSpeed, settings) : "—"],
                        ["UV", pick ? Math.max(...hours.map((h) => h.uvIndex)).toFixed(1) : "—"],
                        [
                          "Air quality",
                          context.airQuality.available
                            ? (context.airQuality.aqiLabel ?? "—")
                            : "Unavailable",
                        ],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between gap-4 border-b border-border pb-1.5"
                        >
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="numeric">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="bg-card p-4">
                    <AiLabel>{part.name} · interpretation</AiLabel>
                    <p className="mt-3 text-sm">{summarise(hours, context)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <ActionChips domain="conditions" />
      </SectionPanel>

      <SectionPanel id="timeline" active={active}>
        <DayTimeline />
      </SectionPanel>

      <SectionPanel id="outfit" active={active} className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <OutfitPlanner />
        <FoodCard />
      </SectionPanel>
    </div>
  );
}
