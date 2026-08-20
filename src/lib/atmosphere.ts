import type { NormalizedContext, WeatherState } from "./env/types";

export type ThemeMode = "light" | "dark";

export interface Atmosphere {
  key: string;
  /** Which sky look is active (clear, overcast, night, sunset…). */
  paletteKey: string;
  state: WeatherState;
  night: boolean;
  mode: ThemeMode;
  sky1: string;
  sky2: string;
  sky3: string;
  glow: string;
  accent: string;
  haze: number;
  label: string;
  /** Token overrides applied to :root so the whole UI matches the sky. */
  theme: Record<string, string>;
}

type Palette = Pick<Atmosphere, "sky1" | "sky2" | "sky3" | "glow" | "accent" | "haze" | "mode"> & {
  theme: Record<string, string>;
};

/** Shared readable surface recipes. Foreground is always chosen against the background. */
function lightTheme(over: Record<string, string> = {}): Record<string, string> {
  return {
    "--background": "oklch(0.975 0.008 240)",
    "--foreground": "oklch(0.22 0.03 258)",
    "--card": "oklch(1 0 0 / 82%)",
    "--card-foreground": "oklch(0.22 0.03 258)",
    "--popover": "oklch(0.99 0.005 240)",
    "--popover-foreground": "oklch(0.22 0.03 258)",
    "--primary": "oklch(0.55 0.14 250)",
    "--primary-foreground": "oklch(0.99 0.005 250)",
    "--secondary": "oklch(0.93 0.012 245)",
    "--secondary-foreground": "oklch(0.25 0.03 255)",
    "--muted": "oklch(0.93 0.012 245)",
    "--muted-foreground": "oklch(0.44 0.025 255)",
    "--accent": "oklch(0.52 0.11 205)",
    "--accent-foreground": "oklch(0.98 0.005 240)",
    "--border": "oklch(0.28 0.03 258 / 14%)",
    "--input": "oklch(0.28 0.03 258 / 20%)",
    "--ring": "oklch(0.55 0.14 250)",
    "--good": "oklch(0.52 0.13 158)",
    "--warn": "oklch(0.56 0.13 62)",
    "--bad": "oklch(0.55 0.19 25)",
    "--data": "oklch(0.5 0.1 205)",
    "--ai": "oklch(0.52 0.16 300)",
    "--surface": "oklch(0.28 0.03 258 / 6%)",
    "--surface-strong": "oklch(0.28 0.03 258 / 12%)",
    ...over,
  };
}

function darkTheme(over: Record<string, string> = {}): Record<string, string> {
  return {
    "--background": "oklch(0.155 0.022 262)",
    "--foreground": "oklch(0.965 0.008 250)",
    "--card": "oklch(0.205 0.024 262)",
    "--card-foreground": "oklch(0.965 0.008 250)",
    "--popover": "oklch(0.19 0.025 262)",
    "--popover-foreground": "oklch(0.965 0.008 250)",
    "--primary": "oklch(0.84 0.13 82)",
    "--primary-foreground": "oklch(0.19 0.03 60)",
    "--secondary": "oklch(0.29 0.03 258)",
    "--secondary-foreground": "oklch(0.95 0.01 250)",
    "--muted": "oklch(0.26 0.025 258)",
    "--muted-foreground": "oklch(0.74 0.02 250)",
    "--accent": "oklch(0.72 0.11 196)",
    "--accent-foreground": "oklch(0.17 0.03 240)",
    "--border": "oklch(0.99 0 0 / 12%)",
    "--input": "oklch(0.99 0 0 / 16%)",
    "--ring": "oklch(0.84 0.13 82)",
    "--good": "oklch(0.76 0.14 158)",
    "--warn": "oklch(0.83 0.14 78)",
    "--bad": "oklch(0.68 0.18 25)",
    "--data": "oklch(0.78 0.09 196)",
    "--ai": "oklch(0.82 0.11 300)",
    "--surface": "oklch(0.99 0 0 / 6%)",
    "--surface-strong": "oklch(0.99 0 0 / 10%)",
    ...over,
  };
}

const PALETTES: Record<string, Palette> = {
  clear: {
    mode: "light",
    sky1: "oklch(0.88 0.09 232)",
    sky2: "oklch(0.93 0.05 228)",
    sky3: "oklch(0.97 0.02 235)",
    glow: "oklch(0.96 0.11 92)",
    accent: "oklch(0.55 0.14 250)",
    haze: 0.08,
    theme: lightTheme(),
  },
  "partly-cloudy": {
    mode: "light",
    sky1: "oklch(0.86 0.07 230)",
    sky2: "oklch(0.92 0.03 236)",
    sky3: "oklch(0.96 0.012 240)",
    glow: "oklch(0.95 0.08 96)",
    accent: "oklch(0.54 0.12 245)",
    haze: 0.16,
    theme: lightTheme(),
  },
  overcast: {
    mode: "light",
    sky1: "oklch(0.8 0.012 245)",
    sky2: "oklch(0.87 0.008 245)",
    sky3: "oklch(0.93 0.005 245)",
    glow: "oklch(0.92 0.008 245)",
    accent: "oklch(0.5 0.06 240)",
    haze: 0.3,
    theme: lightTheme({
      "--background": "oklch(0.945 0.004 245)",
      "--primary": "oklch(0.48 0.07 245)",
      "--ring": "oklch(0.48 0.07 245)",
    }),
  },
  fog: {
    mode: "light",
    sky1: "oklch(0.86 0.004 240)",
    sky2: "oklch(0.9 0.003 240)",
    sky3: "oklch(0.94 0.002 240)",
    glow: "oklch(0.95 0.004 240)",
    accent: "oklch(0.5 0.05 220)",
    haze: 0.55,
    theme: lightTheme({
      "--background": "oklch(0.95 0.002 240)",
      "--primary": "oklch(0.46 0.05 235)",
      "--ring": "oklch(0.46 0.05 235)",
    }),
  },
  rain: {
    mode: "light",
    sky1: "oklch(0.66 0.035 245)",
    sky2: "oklch(0.78 0.025 245)",
    sky3: "oklch(0.88 0.015 245)",
    glow: "oklch(0.86 0.03 235)",
    accent: "oklch(0.48 0.1 235)",
    haze: 0.32,
    theme: lightTheme({
      "--background": "oklch(0.925 0.008 245)",
      "--primary": "oklch(0.46 0.11 240)",
      "--ring": "oklch(0.46 0.11 240)",
    }),
  },
  thunderstorm: {
    mode: "dark",
    sky1: "oklch(0.36 0.045 275)",
    sky2: "oklch(0.24 0.04 278)",
    sky3: "oklch(0.16 0.03 272)",
    glow: "oklch(0.78 0.13 95)",
    accent: "oklch(0.8 0.13 92)",
    haze: 0.34,
    theme: darkTheme({
      "--background": "oklch(0.17 0.03 275)",
      "--card": "oklch(0.22 0.032 275)",
    }),
  },
  snow: {
    mode: "light",
    sky1: "oklch(0.86 0.012 240)",
    sky2: "oklch(0.92 0.008 240)",
    sky3: "oklch(0.97 0.004 240)",
    glow: "oklch(0.98 0.004 240)",
    accent: "oklch(0.48 0.08 225)",
    haze: 0.36,
    theme: lightTheme({
      "--background": "oklch(0.97 0.003 235)",
      "--primary": "oklch(0.46 0.09 230)",
      "--ring": "oklch(0.46 0.09 230)",
    }),
  },
  night: {
    mode: "dark",
    sky1: "oklch(0.26 0.05 265)",
    sky2: "oklch(0.16 0.04 268)",
    sky3: "oklch(0.1 0.03 270)",
    glow: "oklch(0.82 0.04 250)",
    accent: "oklch(0.78 0.09 250)",
    haze: 0.18,
    theme: darkTheme(),
  },
  "night-rain": {
    mode: "dark",
    sky1: "oklch(0.28 0.035 255)",
    sky2: "oklch(0.18 0.03 260)",
    sky3: "oklch(0.11 0.025 265)",
    glow: "oklch(0.7 0.05 230)",
    accent: "oklch(0.74 0.1 215)",
    haze: 0.3,
    theme: darkTheme({ "--primary": "oklch(0.78 0.1 215)", "--ring": "oklch(0.78 0.1 215)" }),
  },
  sunrise: {
    mode: "light",
    sky1: "oklch(0.84 0.1 55)",
    sky2: "oklch(0.9 0.06 60)",
    sky3: "oklch(0.95 0.03 70)",
    glow: "oklch(0.93 0.12 68)",
    accent: "oklch(0.55 0.14 40)",
    haze: 0.22,
    theme: lightTheme({
      "--background": "oklch(0.97 0.012 70)",
      "--primary": "oklch(0.53 0.15 40)",
      "--ring": "oklch(0.53 0.15 40)",
    }),
  },
  sunset: {
    mode: "dark",
    sky1: "oklch(0.6 0.16 45)",
    sky2: "oklch(0.38 0.13 18)",
    sky3: "oklch(0.2 0.07 300)",
    glow: "oklch(0.86 0.15 62)",
    accent: "oklch(0.84 0.14 58)",
    haze: 0.22,
    theme: darkTheme({
      "--background": "oklch(0.18 0.035 300)",
      "--card": "oklch(0.23 0.04 300)",
      "--primary": "oklch(0.85 0.14 58)",
      "--ring": "oklch(0.85 0.14 58)",
    }),
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
  const sunriseHour = Number((ctx?.sun.sunrise ?? "06:00").slice(0, 2));
  const clearish = state === "clear" || state === "partly-cloudy";
  const isGolden = !night && Math.abs(hour - sunsetHour) <= 1;
  const isDawn = !night && Math.abs(hour - sunriseHour) <= 1;

  let paletteKey: string = state;
  if (night) {
    if (state === "thunderstorm") paletteKey = "thunderstorm";
    else if (state === "rain" || state === "snow") paletteKey = "night-rain";
    else paletteKey = "night";
  } else if (isGolden && clearish) paletteKey = "sunset";
  else if (isDawn && clearish) paletteKey = "sunrise";

  const palette = PALETTES[paletteKey] ?? PALETTES["clear"]!;
  const temp = ctx?.current.feelsLike ?? 20;

  return {
    key: `${paletteKey}-${night ? "night" : "day"}`,
    paletteKey,
    state,
    night,
    label: LABELS[state],
    ...palette,
    // Layer temperature lighting on top of the primary weather state.
    glow:
      temp >= 30
        ? palette.mode === "light"
          ? "oklch(0.94 0.12 70)"
          : "oklch(0.86 0.15 68)"
        : temp <= 8
          ? palette.mode === "light"
            ? "oklch(0.95 0.04 225)"
            : "oklch(0.85 0.05 220)"
          : palette.glow,
  };
}
