import { createFileRoute, Link } from "@tanstack/react-router";

import { ActivityGrid } from "@/components/ActivityGrid";
import { ConditionsPanel } from "@/components/ConditionsPanel";
import { DayTimeline } from "@/components/DayTimeline";
import { EnvironmentScene } from "@/components/EnvironmentScene";
import { LiveIndicator } from "@/components/LiveIndicator";
import { LocationSelector } from "@/components/LocationSelector";
import { SectionNav } from "@/components/SectionNav";
import { DailyBrief } from "@/components/features/DailyBrief";
import { FoodCard } from "@/components/features/FoodCard";
import { OutfitPlanner } from "@/components/features/OutfitPlanner";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatTemp } from "@/lib/env/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acclimate — What can you do today?" },
      {
        name: "description",
        content:
          "Acclimate turns live weather, air quality and solar data into practical daily decisions: when to go outside, what to wear and whether to hold your event.",
      },
      { property: "og:title", content: "Acclimate — What can you do today?" },
      {
        property: "og:description",
        content: "Live environmental data, interpreted into what you should actually do today.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { context, settings } = useEnvironment();

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <EnvironmentScene />
        <div className="relative mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-center px-4 py-10 md:px-6">
          <LiveIndicator className="mb-4" />
          <h1 className="display-xl max-w-4xl">What can you do today?</h1>
          <p className="mt-3 max-w-xl text-base text-foreground/80">
            Your day, interpreted through the world around you.
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Weather apps tell you what the weather is. Acclimate tells you what to do about it.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <LocationSelector />
            <Link
              to="/plan"
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Plan something
            </Link>
            <a
              href="#brief"
              className="rounded-full border border-border px-4 py-2.5 text-sm transition-colors hover:bg-surface"
            >
              Read today's brief
            </a>
          </div>

          {context && (
            <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
              {[
                { k: "Now", v: formatTemp(context.current.temperature, settings) },
                { k: "Feels", v: formatTemp(context.current.feelsLike, settings) },
                { k: "Sky", v: context.current.description },
                { k: "Sunset", v: context.sun.sunset.slice(0, 5) },
              ].map((item) => (
                <div key={item.k}>
                  <dt className="eyebrow">{item.k}</dt>
                  <dd className="numeric mt-1 text-lg">{item.v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-5 px-4 pb-8 md:px-6">
        <SectionNav items={SECTIONS} active={active} onChange={setActive} />
        <SectionPanel id="brief" active={active}>
          <DailyBrief />
        </SectionPanel>
        <SectionPanel id="activities" active={active}>
          <ActivityGrid />
        </SectionPanel>
        <SectionPanel id="conditions" active={active}>
          <ConditionsPanel />
        </SectionPanel>
        <SectionPanel id="timeline" active={active}>
          <DayTimeline />
        </SectionPanel>
        <SectionPanel id="outfit" active={active} className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <OutfitPlanner />
          <FoodCard />
        </SectionPanel>
      </div>
    </>
  );
}
