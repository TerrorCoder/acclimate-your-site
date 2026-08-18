import type { NormalizedContext, WeatherState } from "./env/types";

export interface Atmosphere {
  key: string;
  state: WeatherState;
  night: boolean;
  sky1: string;
  sky2: string;
  sky3: string;
  glow: string;
  accent: string;
  haze: number;
  label: string;
}

const PALETTES: Record<string, Omit<Atmosphere, "key" | "state" | "night" | "label">> = {
  clear: {
    sky1: "oklch(0.62 0.14 235)",
    sky2: "oklch(0.42 0.11 245)",
    sky3: "oklch(0.22 0.06 255)",
    glow: "oklch(0.86 0.14 82)",
    accent: "oklch(0.82 0.15 78)",
    haze: 0.12,
  },
  "partly-cloudy": {
    sky1: "oklch(0.58 0.10 232)",
    sky2: "oklch(0.38 0.07 248)",
    sky3: "oklch(0.2 0.04 258)",
    glow: "oklch(0.82 0.10 90)",
    accent: "oklch(0.79 0.12 88)",
    haze: 0.2,
  },
  overcast: {
    sky1: "oklch(0.52 0.03 240)",
    sky2: "oklch(0.34 0.025 250)",
    sky3: "oklch(0.19 0.02 258)",
    glow: "oklch(0.72 0.03 240)",
    accent: "oklch(0.74 0.06 210)",
    haze: 0.34,
  },
  fog: {
    sky1: "oklch(0.6 0.015 235)",
    sky2: "oklch(0.42 0.012 240)",
    sky3: "oklch(0.26 0.01 250)",
    glow: "oklch(0.8 0.01 240)",
    accent: "oklch(0.76 0.03 200)",
    haze: 0.55,
  },
  rain: {
    sky1: "oklch(0.42 0.05 245)",
    sky2: "oklch(0.28 0.04 252)",
    sky3: "oklch(0.16 0.03 258)",
    glow: "oklch(0.66 0.08 220)",
    accent: "oklch(0.74 0.11 210)",
    haze: 0.3,
  },
  thunderstorm: {
    sky1: "oklch(0.32 0.045 275)",
    sky2: "oklch(0.2 0.04 280)",
    sky3: "oklch(0.12 0.03 275)",
    glow: "oklch(0.72 0.13 95)",
    accent: "oklch(0.78 0.14 90)",
    haze: 0.32,
  },
  snow: {
    sky1: "oklch(0.66 0.02 240)",
    sky2: "oklch(0.46 0.02 245)",
    sky3: "oklch(0.26 0.02 255)",
    glow: "oklch(0.9 0.01 240)",
    accent: "oklch(0.82 0.05 220)",
    haze: 0.38,
  },
  night: {
    sky1: "oklch(0.26 0.05 265)",
    sky2: "oklch(0.16 0.04 268)",
    sky3: "oklch(0.10 0.03 270)",
    glow: "oklch(0.72 0.05 250)",
    accent: "oklch(0.78 0.09 250)",
    haze: 0.18,
  },
  sunset: {
    sky1: "oklch(0.62 0.16 45)",
    sky2: "oklch(0.4 0.13 20)",
    sky3: "oklch(0.22 0.08 300)",
    glow: "oklch(0.84 0.15 60)",
    accent: "oklch(0.8 0.15 55)",
    haze: 0.22,
  },
};

const LABELS: Record<WeatherState, string> = {
  clear: "Clear",
  "partly-cloudy": "Partly cloudy",
  overcast: "Overcast",
  fog: "Fog",
  rain: "Rain",
  thunderstorm: "Thunderstorm",
  snow: "Snow",
};

export function atmosphereFor(ctx?: NormalizedContext): Atmosphere {
  const state: WeatherState = ctx?.current.state ?? "clear";
  const night = ctx ? !ctx.current.isDay : false;
  const hour = Number((ctx?.time ?? "12:00").slice(0, 2));
  const sunsetHour = Number((ctx?.sun.sunset ?? "18:00").slice(0, 2));
  const isGolden = !night && Math.abs(hour - sunsetHour) <= 1;

  let paletteKey: string = state;
  if (night) paletteKey = state === "thunderstorm" || state === "rain" ? state : "night";
  else if (isGolden && (state === "clear" || state === "partly-cloudy")) paletteKey = "sunset";

  const palette = PALETTES[paletteKey] ?? PALETTES["clear"]!;
  const temp = ctx?.current.feelsLike ?? 20;

  return {
    key: `${paletteKey}-${night ? "night" : "day"}`,
    state,
    night,
    label: LABELS[state],
    ...palette,
    // Layer temperature lighting on top of the primary weather state.
    glow: temp >= 30 ? "oklch(0.86 0.15 68)" : temp <= 8 ? "oklch(0.85 0.05 220)" : palette.glow,
  };
}
