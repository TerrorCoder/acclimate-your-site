import { useEffect, useRef, useState } from "react";

export type SectionItem = { id: string; label: string };

/**
 * Sticky in-page section rail.
 *
 * Shows every section of the page as a pill so people can see what's below the fold
 * and jump straight to it instead of scrolling. Scroll-spy keeps the active pill in
 * sync, and the rail scrolls horizontally on narrow screens.
 */
export function SectionNav({ items, label = "Sections" }: { items: SectionItem[]; label?: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-118px 0px -55% 0px", threshold: [0, 0.15, 0.5] },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [items]);

  // Keep the active pill in view on the horizontal rail.
  useEffect(() => {
    const rail = railRef.current;
    const pill = rail?.querySelector<HTMLElement>(`[data-pill="${active}"]`);
    if (!rail || !pill) return;
    const left = pill.offsetLeft - rail.clientWidth / 2 + pill.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 116;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      aria-label={label}
      className="sticky top-[62px] z-30 -mx-4 mb-1 border-b border-border/70 bg-background/70 px-4 py-2 backdrop-blur-xl md:-mx-6 md:px-6"
    >
      <div
        ref={railRef}
        className="flex snap-x items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              data-pill={item.id}
              onClick={() => go(item.id)}
              aria-current={on ? "true" : undefined}
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
