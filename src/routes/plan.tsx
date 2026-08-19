import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { EventPlanner } from "@/components/features/EventPlanner";
import { OutfitPlanner } from "@/components/features/OutfitPlanner";
import { ResponseCard } from "@/components/ai/ResponseCard";
import { useRecommendation } from "@/lib/ai/useRecommendation";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan an outdoor day — Acclimate" },
      {
        name: "description",
        content:
          "Enter an event, hike, shoot or family outing and Acclimate scores readiness against the real forecast, then shows how moving the time changes it.",
      },
      { property: "og:title", content: "Plan an outdoor day — Acclimate" },
      {
        property: "og:description",
        content: "Event readiness scoring, risks, preparation checklists and time comparison from live data.",
      },
    ],
  }),
  component: PlanPage,
});

const CHOICES = ["Outdoor Event", "Photography", "Family Outing", "Hike / Picnic"] as const;

const ACTIVITY_MAP: Record<string, string> = {
  Photography: "Take Photos",
  "Family Outing": "Family Day",
  "Hike / Picnic": "Go Outside",
};

function PlanPage() {
  const [choice, setChoice] = useState<(typeof CHOICES)[number]>("Outdoor Event");
  const activity = ACTIVITY_MAP[choice];
  const { data, isFetching } = useRecommendation("activity", { activity: activity ?? "" }, Boolean(activity));

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 md:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow">Plan</p>
        <h1 className="display-lg mt-2">Plan something. We'll check the conditions.</h1>
        <p className="mt-3 text-muted-foreground">
          Choose what you have in mind. Every assessment is rebuilt from the forecast for the exact hours you pick.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CHOICES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={choice === c}
            onClick={() => setChoice(c)}
            className="rounded-full border px-4 py-2 text-sm transition-colors"
            style={
              choice === c
                ? { borderColor: "var(--color-primary)", color: "var(--color-primary)" }
                : { borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }
            }
          >
            {c}
          </button>
        ))}
      </div>

      {choice === "Outdoor Event" ? (
        <>
          <EventPlanner />
          <OutfitPlanner withControls={false} />
        </>
      ) : (
        <div className="space-y-4">
          <ResponseCard response={data} isLoading={isFetching || !data} headline={choice} />
          <OutfitPlanner />
        </div>
      )}
    </div>
  );
}
