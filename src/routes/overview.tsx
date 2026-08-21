import { createFileRoute } from "@tanstack/react-router";

import { ActivityGrid } from "@/components/ActivityGrid";
import { ConditionsPanel } from "@/components/ConditionsPanel";
import { DayTimeline } from "@/components/DayTimeline";
import { EnvironmentScene } from "@/components/EnvironmentScene";
import { SectionNav, SectionPanel, useSectionTabs } from "@/components/SectionNav";
import { DailyBrief } from "@/components/features/DailyBrief";
import { FoodCard } from "@/components/features/FoodCard";
import { OutfitPlanner } from "@/components/features/OutfitPlanner";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Daily Overview — Acclimate" },
      {
        name: "description",
        content:
          "Complete multi-section breakdown: daily brief, activity suitability, environmental conditions, 24-hour timeline, and outfit & food planning.",
      },
      { property: "og:title", content: "Daily Overview — Acclimate" },
      {
        property: "og:description",
        content: "Explore every angle of today's conditions and AI recommendations.",
      },
    ],
  }),
  component: OverviewPage,
});

const SECTIONS = [
  { id: "brief", label: "Daily brief" },
  { id: "activities", label: "Activities" },
  { id: "conditions", label: "Conditions" },
  { id: "timeline", label: "Timeline" },
  { id: "outfit", label: "Outfit & food" },
];

function OverviewPage() {
  const { context } = useEnvironment();
  const { active, setActive } = useSectionTabs(SECTIONS);

  return (
    <div className="relative">
      <EnvironmentScene height="short" />
      <div className="relative mx-auto max-w-7xl space-y-7 px-4 pt-8 pb-14 md:px-6">
        <header className="max-w-3xl">
          <p className="eyebrow">Full Dashboard</p>
          <h1 className="display-lg mt-2">
            {context ? `${context.location.name} — Full Overview` : "Loading your day"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Explore every angle of today: intelligence brief, athletic suitability, live physical metrics, hourly forecast, and sartorial guidance.
          </p>
        </header>

        <div className="space-y-5">
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
      </div>
    </div>
  );
}
