import type { WeatherState } from "./types";

export function stateFromCode(code: number, cloudCover = 0): WeatherState {
  if (code >= 95) return "thunderstorm";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 85) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code === 3 || cloudCover >= 80) return "overcast";
  if (code === 1 || code === 2 || cloudCover >= 25) return "partly-cloudy";
  return "clear";
}

const DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

export function describeCode(code: number): string {
  return DESCRIPTIONS[code] ?? "Mixed conditions";
}
