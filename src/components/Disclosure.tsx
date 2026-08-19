import type { ReactNode } from "react";

/** Progressive disclosure: verdict stays visible, raw data is one tap away. */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className = "",
}: {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details open={defaultOpen} className={`group ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
        {summary}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
