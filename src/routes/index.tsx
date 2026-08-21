import { createFileRoute, Link } from "@tanstack/react-router";

import { LiveIndicator } from "@/components/LiveIndicator";
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

/**
 * Landing page = one screen.
 *
 * Everything that used to be stacked below the fold (brief, activities, conditions,
 * timeline, outfit) now lives on /today, where it is switchable by tab. The home page
 * is purely the live sky, the headline, the current read-out and the doors into the app.
 */
const DOORS = [
  { to: "/today", label: "Today", note: "Brief, activities, conditions, timeline, outfit" },
  { to: "/plan", label: "Plan", note: "Score an event against the real forecast" },
  { to: "/explore", label: "Explore", note: "Best windows for each thing you do" },
  { to: "/insights", label: "Insights", note: "The week ahead, in trends" },
] as const;

function Home() {
  const { context, settings } = useEnvironment();

  return (
    <section className="relative isolate">
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl flex-col justify-center px-4 py-10 md:px-6">
        <LiveIndicator className="mb-4" />
        <h1 className="display-xl max-w-4xl">What can you do today?</h1>
        <p className="mt-3 max-w-xl text-base text-foreground/80">
          Your day, interpreted through the world around you.
        </p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Weather apps tell you what the weather is. Acclimate tells you what to do about it.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <Link
            to="/today"
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Read today's brief
          </Link>
          <Link
            to="/plan"
            className="rounded-full border border-border px-4 py-2.5 text-sm transition-colors hover:bg-surface"
          >
            Plan something
          </Link>
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

        <nav aria-label="Sections" className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {DOORS.map((door) => (
            <Link
              key={door.to}
              to={door.to}
              className="panel-quiet group p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-strong"
            >
              <span className="flex items-center justify-between text-sm font-medium">
                {door.label}
                <span className="opacity-40 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{door.note}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
