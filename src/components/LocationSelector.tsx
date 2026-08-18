import { useEffect, useRef, useState } from "react";

import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { searchLocations } from "@/lib/env/sources";
import { POPULAR_LOCATIONS } from "@/lib/env/settings";
import type { LocationInfo } from "@/lib/env/types";

export function LocationSelector({ compact = false }: { compact?: boolean }) {
  const { location, setLocation } = useEnvironment();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const found = await searchLocations(query);
      setResults(found);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const choose = (loc: LocationInfo) => {
    setLocation(loc);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const list = results.length ? results : query.length >= 2 ? [] : POPULAR_LOCATIONS;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`group flex items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm transition-colors hover:bg-surface-strong ${
          compact ? "py-1.5" : "py-2.5"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.6" />
        </svg>
        <span className="max-w-[12rem] truncate">{location.name}</span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="panel absolute right-0 z-50 mt-2 w-80 overflow-hidden p-3">
          <label className="sr-only" htmlFor="location-search">
            Search for a city
          </label>
          <input
            id="location-search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city…"
            className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          <div className="mt-3 max-h-72 overflow-y-auto" role="listbox">
            {!results.length && query.length >= 2 && (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                {searching ? "Searching…" : "No places found. Try another spelling."}
              </p>
            )}
            {!query && <p className="eyebrow px-1 pb-2">Popular</p>}
            {list.map((loc) => (
              <button
                key={`${loc.name}-${loc.latitude}-${loc.longitude}`}
                type="button"
                role="option"
                aria-selected={loc.name === location.name}
                onClick={() => choose(loc)}
                className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface"
              >
                <span>{loc.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {[loc.admin, loc.country].filter(Boolean).join(", ")}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 border-t border-border pt-2 text-[0.65rem] text-muted-foreground">
            Search via Open-Meteo Geocoding, with OpenStreetMap / Nominatim as fallback.
          </p>
        </div>
      )}
    </div>
  );
}
