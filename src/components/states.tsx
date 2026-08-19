import type { ReactNode } from "react";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function PanelSkeleton({ lines = 4, title = true }: { lines?: number; title?: boolean }) {
  return (
    <div className="panel space-y-3 p-4" aria-busy="true" aria-live="polite">
      {title && <SkeletonBlock className="h-4 w-36" />}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-3 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-11/12" : "w-8/12"}`} />
      ))}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't reach the environment data",
  message = "The public data sources didn't respond. You can retry, or continue with clearly-labelled demo data.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="panel p-8 text-center">
      <h3 className="display-md">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-quiet flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 h-10 w-10 rounded-full border border-border" />
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
