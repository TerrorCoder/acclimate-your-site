import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useMatches,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { AskAI } from "@/components/AskAI";
import { AtmosphereTheme } from "@/components/AtmosphereTheme";
import { EnvironmentProvider } from "@/lib/env/EnvironmentProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. You can try refreshing or returning to the home page.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [chipQuestion, setChipQuestion] = useState<string | undefined>();
  const matches = useMatches();

  // Client-side Title & Meta synchronization across SPA navigation
  useEffect(() => {
    const canonicalUrl = new URL(window.location.pathname, "https://acclimate.kairosgroup.co.zw");
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const openGraphUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');

    canonical?.setAttribute("href", canonicalUrl.href);
    openGraphUrl?.setAttribute("content", canonicalUrl.href);
    robots?.setAttribute(
      "content",
      window.location.pathname === "/settings"
        ? "noindex, follow"
        : "index, follow, max-image-preview:large",
    );

    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i] as any;
      const head = match?.options?.head || match?.head || match?.routeContext?.head;
      if (typeof head === "function") {
        try {
          const res = head();
          if (res?.meta) {
            const titleObj = res.meta.find((m: any) => m.title);
            if (titleObj?.title) {
              document.title = titleObj.title;
            }
            const descObj = res.meta.find((m: any) => m.name === "description");
            if (descObj?.content) {
              const metaDesc = document.querySelector('meta[name="description"]');
              if (metaDesc) metaDesc.setAttribute("content", descObj.content);
            }
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }, [matches]);

  // Listen for ActionChip clicks dispatched as custom events
  useEffect(() => {
    const handler = (e: Event) => {
      const question = (e as CustomEvent<string>).detail;
      if (question) setChipQuestion(question);
    };
    window.addEventListener("acclimate:ask", handler);
    return () => window.removeEventListener("acclimate:ask", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <EnvironmentProvider>
        <AtmosphereTheme />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <AskAI
          initialQuestion={chipQuestion}
          onInitialQuestionConsumed={() => setChipQuestion(undefined)}
        />
      </EnvironmentProvider>
    </QueryClientProvider>
  );
}
