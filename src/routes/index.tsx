import { createFileRoute, Link } from "@tanstack/react-router";

import { EnvironmentScene } from "@/components/EnvironmentScene";
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

function Home() {
  const { context, settings } = useEnvironment();

  return (
    <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden">
      <EnvironmentScene height="full" />
      <div className="relative mx-auto flex min-h-[82vh] max-w-7xl flex-col justify-center px-4 py-12 md:px-6">
        <LiveIndicator className="mb-4" />
        <h1 className="display-xl max-w-4xl tracking-tight">What can you do today?</h1>
        <p className="mt-3 max-w-xl text-lg text-foreground/90 font-medium">
          Your day, interpreted through the world around you.
        </p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Weather apps tell you what the weather is. Acclimate tells you what to do about it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/overview"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Explore Dashboard →
          </Link>
          <Link
            to="/today"
            className="rounded-full border border-border bg-card/80 px-4 py-2.5 text-sm backdrop-blur transition-colors hover:bg-surface"
          >
            Today's Breakdown
          </Link>
          <Link
            to="/plan"
            className="rounded-full border border-border bg-card/80 px-4 py-2.5 text-sm backdrop-blur transition-colors hover:bg-surface"
          >
            Plan an Event
          </Link>
        </div>

        {context && (
          <div className="mt-10 max-w-3xl rounded-2xl border border-border/80 bg-card/75 p-6 backdrop-blur-md">
            <p className="eyebrow text-muted-foreground">Live Conditions · {context.location.name}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              {[
                { k: "Now", v: formatTemp(context.current.temperature, settings) },
                { k: "Feels", v: formatTemp(context.current.feelsLike, settings) },
                { k: "Sky", v: context.current.description },
                { k: "Sunset", v: context.sun.sunset.slice(0, 5) },
              ].map((item) => (
                <div key={item.k}>
                  <dt className="eyebrow text-xs">{item.k}</dt>
                  <dd className="numeric mt-1 text-2xl font-medium">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
