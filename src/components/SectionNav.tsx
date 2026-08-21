import { useCallback, useEffect, useRef, useState } from "react";

export type SectionItem = { id: string; label: string };

/**
 * Hash-synced tab state for in-page "sections as pages".
 *
 * Sections are no longer scrolled to — clicking a pill swaps the rendered view,
 * exactly like navigating between routes in the header. The URL hash keeps the
 * active view shareable and back/forward friendly.
 */
export function useSectionTabs(items: SectionItem[], initial?: string) {
  const fallback = initial ?? items[0]?.id ?? "";
  const [active, setActiveState] = useState(fallback);

  useEffect(() => {
    const ids = items.map((i) => i.id);
    const apply = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && ids.includes(hash)) setActiveState(hash);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join("|")]);

  const setActive = useCallback((id: string) => {
    setActiveState(id);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#${id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return { active, setActive };
}

/**
 * Sticky section switcher.
 *
 * Behaves like a secondary header: always visible, always showing every view of
 * the page, and clicking swaps the content instead of scrolling to it.
 */
export function SectionNav({
  items,
  active,
  onChange,
  label = "Sections",
}: {
  items: SectionItem[];
  active: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the active pill in view on the horizontal rail.
  useEffect(() => {
    const rail = railRef.current;
    const pill = rail?.querySelector<HTMLElement>(`[data-pill="${active}"]`);
    if (!rail || !pill) return;
    const left = pill.offsetLeft - rail.clientWidth / 2 + pill.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label={label}
      className="sticky top-[62px] z-30 -mx-4 mb-1 border-b border-border/70 bg-background/70 px-4 py-2 backdrop-blur-xl md:-mx-6 md:px-6"
    >
      <div
        ref={railRef}
        role="tablist"
        aria-label={label}
        className="flex snap-x items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={on}
              aria-controls={`panel-${item.id}`}
              data-pill={item.id}
              onClick={() => onChange(item.id)}
              className={`group flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                on
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                  : "border-border text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <span
                className={`numeric text-[10px] tabular-nums transition-opacity ${
                  on ? "opacity-80" : "opacity-45"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Wrapper for a single switchable view. */
export function SectionPanel({
  id,
  active,
  className,
  children,
}: {
  id: string;
  active: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (id !== active) return null;
  return (
    <section
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className={`animate-in fade-in duration-300 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
