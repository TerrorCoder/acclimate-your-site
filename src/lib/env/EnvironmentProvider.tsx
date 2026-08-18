import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildContext } from "./context";
import { buildDemoContext } from "./demo";
import {
  DEFAULT_LOCATION,
  DEFAULT_SETTINGS,
  loadLocation,
  loadSettings,
  saveLocation,
  saveSettings,
  type Settings,
} from "./settings";
import type { LocationInfo, NormalizedContext } from "./types";

interface EnvironmentValue {
  context: NormalizedContext | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refresh: () => void;
  location: LocationInfo;
  setLocation: (location: LocationInfo) => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  hydrated: boolean;
}

const EnvironmentContext = createContext<EnvironmentValue | null>(null);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocationState(loadLocation());
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  const query = useQuery({
    queryKey: ["environment", location.latitude, location.longitude],
    queryFn: async () => {
      try {
        return await buildContext(location);
      } catch {
        return buildDemoContext();
      }
    },
    enabled: hydrated,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const setLocation = useCallback((next: LocationInfo) => {
    setLocationState(next);
    saveLocation(next);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.units && !patch.tempUnit) next.tempUnit = patch.units === "imperial" ? "F" : "C";
      saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<EnvironmentValue>(
    () => ({
      context: query.data,
      isLoading: query.isLoading || !hydrated,
      isError: query.isError,
      isFetching: query.isFetching,
      refresh: () => void query.refetch(),
      location,
      setLocation,
      settings,
      updateSettings,
      hydrated,
    }),
    [query, location, setLocation, settings, updateSettings, hydrated],
  );

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment(): EnvironmentValue {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) throw new Error("useEnvironment must be used inside EnvironmentProvider");
  return ctx;
}

/** Convenience hook for features that require a resolved context. */
export function useEnvContext(): NormalizedContext | undefined {
  return useEnvironment().context;
}
