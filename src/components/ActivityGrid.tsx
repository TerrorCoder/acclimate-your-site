import { useState } from "react";

import { useRecommendation } from "@/lib/ai/useRecommendation";
import { ResponseCard } from "@/components/ai/ResponseCard";

export const ACTIVITIES = [
  { name: "Go Outside", icon: "M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" },
  { name: "Exercise", icon: "M6 8v8m12-8v8M3 12h18M9 6v12m6-12v12" },
  { name: "Have an Event", icon: "M4 7h16v13H4zM4 11h16M8 3v4m8-4v4" },
  { name: "Take Photos", icon: "M4 8h3l1.5-2h7L17 8h3v11H4zM12 16a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" },
  { name: "Eat Outside", icon: "M6 3v8a2 2 0 0 0 4 0V3M8 11v10M17 3c-1.5 2-2 4-2 6h4c0-2-.5-4-2-6Zm0 6v12" },
  { name: "Family Day", icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 20c0-3 2.2-5 5-5s5 2 5 5m2 0c0-2.4 1.4-4.2 4-4.2" },
  { name: "Stargaze", icon: "M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11ZM17 4l.6 1.6L19 6l-1.4.5L17 8l-.6-1.5L15 6l1.4-.4Z" },
  { name: "Watch Sunset", icon: "M4 18h16M7 18a5 5 0 0 1 10 0M12 3v3M4.9 7.9l2 2m12.2-2-2 2M2 14h2m16 0h2" },
] as const;

export function ActivityGrid() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isFetching } = useRecommendation("activity", { activity: selected ?? "" }, Boolean(selected));

  return (
    <section aria-labelledby="what-can-you-do" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="what-can-you-do" className="display-lg">
          What can you do today?
        </h2>
        <p className="text-sm text-muted-foreground">Pick one — the answer is built from live conditions.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ACTIVITIES.map((activity) => {
          const active = selected === activity.name;
          return (
            <button
              key={activity.name}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(active ? null : activity.name)}
              className="panel-quiet group flex flex-col items-start gap-4 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-strong"
              style={
                active
                  ? {
                      borderColor: "var(--color-primary)",
                      background: "color-mix(in oklab, var(--color-primary) 10%, transparent)",
                    }
                  : undefined
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 opacity-80 transition-transform duration-300 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d={activity.icon} />
              </svg>
              <span className="text-sm font-medium">{activity.name}</span>
            </button>
          );
        })}
      </div>

      {selected && <ResponseCard response={data} isLoading={isFetching || !data} headline={selected} />}
    </section>
  );
}
