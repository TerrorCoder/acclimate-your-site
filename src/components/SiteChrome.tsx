import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LiveIndicator } from "@/components/LiveIndicator";
import { LocationSelector } from "@/components/LocationSelector";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

const NAV = [
  { to: "/", label: "Home" },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
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
        <nav aria-label="Mobile" className="border-t border-border bg-background/95 px-5 py-3 lg:hidden">
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
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3 md:px-8">
        <div>
          <p className="display-md text-xl">Acclimate</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Weather apps tell you what the weather is. We tell you what to do about it.
          </p>
          <div className="mt-4">
            <LiveIndicator />
          </div>
        </div>
        <div>
          <p className="eyebrow">Data sources</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>
              <a className="hover:text-foreground" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                Open-Meteo — forecast &amp; geocoding
              </a>
            </li>
            <li>
              <a className="hover:text-foreground" href="https://docs.openaq.org/" target="_blank" rel="noreferrer">
                OpenAQ — air quality
              </a>
            </li>
            <li>
              <a className="hover:text-foreground" href="https://sunrisesunset.io/api/" target="_blank" rel="noreferrer">
                SunriseSunset.io — solar times
              </a>
            </li>
            <li>
              <a className="hover:text-foreground" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                © OpenStreetMap contributors — Nominatim
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Currently using</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {context ? context.sources.join(" · ") : "Connecting to live sources…"}
          </p>
          {context?.degraded.length ? (
            <p className="mt-3 text-sm" style={{ color: "var(--color-warn)" }}>
              {context.degraded.join(" · ")}
            </p>
          ) : null}
          <p className="mt-4 text-xs text-muted-foreground">
            AI recommendations run through a single interpretation layer and are advisory only.
          </p>
        </div>
      </div>
    </footer>
  );
}
