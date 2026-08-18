import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { formatTime } from "@/lib/env/format";

function relative(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Updated just now";
  if (diff === 1) return "Updated 1 min ago";
  if (diff < 60) return `Updated ${diff} mins ago`;
  return "Updated over an hour ago";
}

export function LiveIndicator({ className = "" }: { className?: string }) {
  const { context, settings, isFetching, refresh } = useEnvironment();
  if (!context) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="skeleton h-3 w-40" />
      </div>
    );
  }
  const demo = context.mode === "demo";

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <span className="flex items-center gap-2">
        <span
          className="live-dot"
          style={demo ? { background: "var(--color-warn)" } : undefined}
        />
        <span className="eyebrow">{demo ? "Demo data" : "Live conditions"}</span>
      </span>
      <span className="numeric text-sm text-foreground/90">
        {context.location.name} · {formatTime(context.time, settings)}
      </span>
      <button
        type="button"
        onClick={refresh}
        className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        {isFetching ? "Refreshing…" : relative(context.fetchedAt)}
      </button>
    </div>
  );
}
