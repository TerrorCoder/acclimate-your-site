import { createFileRoute } from "@tanstack/react-router";

import { EnvironmentScene } from "@/components/EnvironmentScene";
import { ConditionsPanel } from "@/components/ConditionsPanel";
import { DayTimeline } from "@/components/DayTimeline";
import { SectionNav, SectionPanel, useSectionTabs } from "@/components/SectionNav";
import { AiLabel, DataLabel, ResponseCard } from "@/components/ai/ResponseCard";
import { ActionChips } from "@/components/ai/ActionChips";
import { OutfitPlanner } from "@/components/features/OutfitPlanner";
import { PanelSkeleton } from "@/components/states";
import { useRecommendation } from "@/lib/ai/useRecommendation";
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
          "Morning, afternoon, evening and night broken down by temperature, rain, wind, UV and air quality, each with live AI environmental interpretation.",
      },
      { property: "og:title", content: "Today, interpreted — Acclimate" },
      {
        property: "og:description",
        content:
          "A full-day environmental read-out with deep AI interpretation and a preparation checklist.",
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

const SECTIONS = [
  { id: "parts", label: "Across the day" },
  { id: "conditions", label: "Conditions" },
  { id: "timeline", label: "Timeline" },
  { id: "recs", label: "AI plan" },
  { id: "outfit", label: "Outfit guide" },
];

function fallbackSummarise(hours: HourPoint[], ctx: NormalizedContext): string {
  if (!hours.length) return "No forecast hours remain in this part of the day.";
  const rain = Math.max(...hours.map((h) => h.rainProbability));
  const feels = Math.max(...hours.map((h) => h.feelsLike));
  const uv = Math.max(...hours.map((h) => h.uvIndex));
  const wind = Math.max(...hours.map((h) => h.windGusts));
  if (rain >= 55)
    return `Rain probability reaches ${Math.round(rain)}%. Keep outdoor activities under cover.`;
  if (feels >= 31)
    return `Thermal load peaks near ${Math.round(feels)}°C feels-like. Prioritize hydration and shade.`;
  if (uv >= 8)
    return `UV index reaches ${uv.toFixed(0)} — direct skin exposure requires high-grade protection.`;
  if (wind >= 38)
    return `Gusts up to ${Math.round(wind)} km/h impact open-air setups and coastal comfort.`;
  if (!hours[0]?.isDay)
    return `Settled nocturnal conditions easing to ${Math.round(Math.min(...hours.map((h) => h.feelsLike)))}°C. ${ctx.moon.phase} at ${ctx.moon.illumination}% illumination.`;
  return `Stable conditions — approximately ${Math.round(hours[0]!.feelsLike)}°C with ${Math.round(rain)}% peak rain probability. Prime usable window.`;
}

function TodayPage() {
  const { context, settings } = useEnvironment();
  const brief = useRecommendation("daily_brief");
  const dayParts = useRecommendation("day_parts");
  const { active, setActive } = useSectionTabs(SECTIONS);

  return (
    <div className="relative">
      <EnvironmentScene height="short" />
      <div className="relative mx-auto max-w-7xl space-y-6 px-4 pt-8 pb-14 md:px-6">
        <header className="max-w-3xl">
          <p className="eyebrow">Today</p>
          <h1 className="display-lg mt-2">
            {context ? `${context.location.name}, hour by hour` : "Loading your day"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Factual conditions on the left of every block, deep AI interpretation on the right.
          </p>
        </header>

        <SectionNav items={SECTIONS} active={active} onChange={setActive} />

        <SectionPanel id="parts" active={active} className="space-y-4">
          <h2 className="display-md">Across the day</h2>
          {!context ? (
            <PanelSkeleton lines={8} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {PARTS.map((part) => {
                const hours = context.todayHours.filter(
                  (h) => h.hour >= part.from && h.hour < part.to,
                );
                const pick = hours[Math.floor(hours.length / 2)];
                const aiText = (dayParts.data?.extras as Record<string, string> | undefined)?.[part.name];

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
                    <div className="bg-card p-4 flex flex-col justify-between">
                      <div>
                        <AiLabel>
                          {part.name} · {dayParts.data?.aiPowered ? "AI interpretation" : "interpretation"}
                        </AiLabel>
                        {dayParts.isFetching && !aiText ? (
                          <div className="mt-3 space-y-2">
                            <div className="skeleton h-3 w-full" />
                            <div className="skeleton h-3 w-4/5" />
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                            {aiText || fallbackSummarise(hours, context)}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionPanel>

        <SectionPanel id="conditions" active={active} className="space-y-4">
          <ConditionsPanel />
          <ActionChips domain="conditions" />
        </SectionPanel>

        <SectionPanel id="timeline" active={active} className="space-y-4">
          <DayTimeline />
        </SectionPanel>

        <SectionPanel id="recs" active={active} className="space-y-4">
          <h2 className="display-md">AI recommendations</h2>
          <ResponseCard response={brief.data} isLoading={brief.isFetching} headline="Today's plan" />
          <ActionChips domain="daily_brief" />
        </SectionPanel>

        <SectionPanel id="outfit" active={active} className="space-y-4">
          <OutfitPlanner />
        </SectionPanel>
      </div>
    </div>
  );
}
