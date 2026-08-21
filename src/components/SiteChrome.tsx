import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LiveIndicator } from "@/components/LiveIndicator";
import { LocationSelector } from "@/components/LocationSelector";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/overview", label: "Overview" },
  { to: "/today", label: "Today" },
  { to: "/plan", label: "Plan" },
  { to: "/explore", label: "Explore" },
  { to: "/insights", label: "Insights" },
  { to: "/settings", label: "Settings" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="display-md text-xl">Acclimate</span>
          <span className="eyebrow hidden sm:inline">Environmental intelligence</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "rounded-full px-3.5 py-2 text-sm text-foreground bg-surface" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocationSelector compact />
          <button
            type="button"
            className="rounded-full border border-border p-2 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav aria-label="Mobile" className="border-t border-border bg-background/95 px-4 py-3 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
              activeProps={{ className: "block rounded-lg px-3 py-2.5 text-sm text-foreground bg-surface" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { context } = useEnvironment();

  return (
    <footer className="mt-14 border-t border-border/80 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Brand & live status */}
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="display-md text-lg font-semibold tracking-tight">
              Acclimate
            </Link>
            <span className="hidden text-border sm:inline">|</span>
            <LiveIndicator />
          </div>

          {/* Clean inline data source links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="eyebrow text-[10px] text-muted-foreground/80">Data:</span>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground underline-offset-4 hover:underline"
            >
              Open-Meteo
            </a>
            <span>·</span>
            <a
              href="https://docs.openaq.org/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground underline-offset-4 hover:underline"
            >
              OpenAQ
            </a>
            <span>·</span>
            <a
              href="https://sunrisesunset.io/api/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground underline-offset-4 hover:underline"
            >
              SunriseSunset
            </a>
            <span>·</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground underline-offset-4 hover:underline"
            >
              © OSM
            </a>
          </div>
        </div>

        {/* Bottom subtle bar with disclaimer and floating button safe padding */}
        <div className="mt-4 flex flex-col justify-between gap-2 border-t border-border/40 pt-3 text-[11px] text-muted-foreground/75 sm:flex-row sm:items-center pr-28 sm:pr-36">
          <p>
            {context ? `Connected to live sources for ${context.location.name}.` : "Live atmospheric grounding."}
          </p>
          <p>AI recommendations are advisory and grounded in live atmospheric readings.</p>
        </div>
      </div>
    </footer>
  );
}
