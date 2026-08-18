import type { LocationInfo } from "./types";

export interface Settings {
  tempUnit: "C" | "F";
  units: "metric" | "imperial";
  timeFormat: "12h" | "24h";
}

export const DEFAULT_SETTINGS: Settings = {
  tempUnit: "C",
  units: "metric",
  timeFormat: "24h",
};

export const DEFAULT_LOCATION: LocationInfo = {
  name: "Harare",
  admin: "Harare Province",
  country: "Zimbabwe",
  latitude: -17.8292,
  longitude: 31.0522,
  timezone: "Africa/Harare",
};

export const POPULAR_LOCATIONS: LocationInfo[] = [
  DEFAULT_LOCATION,
  { name: "Cape Town", country: "South Africa", latitude: -33.9249, longitude: 18.4241, timezone: "Africa/Johannesburg" },
  { name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276, timezone: "Europe/London" },
  { name: "New York", country: "United States", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York" },
  { name: "Lisbon", country: "Portugal", latitude: 38.7223, longitude: -9.1393, timezone: "Europe/Lisbon" },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore" },
];

const SETTINGS_KEY = "acclimate.settings";
const LOCATION_KEY = "acclimate.location";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function loadLocation(): LocationInfo {
  if (typeof window === "undefined") return DEFAULT_LOCATION;
  try {
    const raw = window.localStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as LocationInfo) : DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}

export function saveLocation(location: LocationInfo) {
  try {
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {
    /* ignore */
  }
}
