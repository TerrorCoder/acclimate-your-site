import { useState } from "react";

import { useRecommendation } from "@/lib/ai/useRecommendation";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatRange } from "@/lib/env/format";
import { BasedOn, AiLabel } from "@/components/ai/ResponseCard";
import { PanelSkeleton } from "@/components/states";

const ACTIVITIES = ["Go Outside", "Exercise", "Have an Event", "Take Photos", "Family Day"];
const FORMALITY = ["Casual", "Smart casual", "Formal"] as const;

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border px-3.5 py-1.5 text-xs transition-colors"
      style={
        active
          ? { borderColor: "var(--color-primary)", color: "var(--color-primary)" }
          : { borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }
      }
    >
      {children}
    </button>
  );
}

export function OutfitPlanner({ withControls = true }: { withControls?: boolean }) {
  const { context, settings } = useEnvironment();
  const [activity, setActivity] = useState("Go Outside");
  const [formality, setFormality] = useState<(typeof FORMALITY)[number]>("Casual");
  const [indoor, setIndoor] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const { data, isFetching } = useRecommendation("outfit", { activity, formality, indoor });

  if (!context || !data || isFetching) return <PanelSkeleton lines={6} />;

  return (
    <section aria-labelledby="outfit" className="panel p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <AiLabel>Outfit planner</AiLabel>
          <h2 id="outfit" className="display-md mt-1">
            What should I wear?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.mainConsideration} · best window {formatRange(data.bestTime, settings)}
          </p>
        </div>
        <p className="eyebrow">{context.location.name}</p>
      </div>

      {withControls && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((a) => (
              <Chip key={a} active={activity === a} onClick={() => setActivity(a)}>
                {a}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMALITY.map((f) => (
              <Chip key={f} active={formality === f} onClick={() => setFormality(f)}>
                {f}
              </Chip>
            ))}
            <Chip active={indoor} onClick={() => setIndoor((v) => !v)}>
              {indoor ? "Mostly indoors" : "Mostly outdoors"}
            </Chip>
          </div>
        </div>
      )}

      <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        {data.whatToDo.map((line) => {
          const [label, ...rest] = line.split(" — ");
          return (
            <div key={line} className="bg-card p-4">
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1.5 text-sm">{rest.join(" — ")}</dd>
            </div>
          );
        })}
      </dl>

      <button
        type="button"
        className="mt-5 text-sm font-medium underline-offset-4 hover:underline"
        onClick={() => setShowWhy((v) => !v)}
        aria-expanded={showWhy}
      >
        Why this works today
      </button>
      {showWhy && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{data.why}</p>}

      <BasedOn sources={data.dataUsed} />
    </section>
  );
}
