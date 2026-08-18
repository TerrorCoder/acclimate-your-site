import type {
  HourPoint,
  Level,
  NormalizedContext,
  Risk,
  Verdict,
} from "../env/types";

export const pad = (n: number) => String(n).padStart(2, "0");

export function fmtRange(startHour: number, endHour: number) {
  return `${pad(startHour)}:00–${pad(endHour)}:00`;
}

export function level(value: number, medium: number, high: number): Level {
  if (value >= high) return "High";
  if (value >= medium) return "Medium";
  return "Low";
}

/** Comfort score 0-100 for a single hour, tuned per activity profile. */
export interface Profile {
  idealTemp: number;
  rainWeight: number;
  uvWeight: number;
  windWeight: number;
  requiresDaylight?: boolean;
  requiresDark?: boolean;
  requiresLowCloud?: boolean;
}

export const PROFILES: Record<string, Profile> = {
  outdoors: { idealTemp: 22, rainWeight: 1, uvWeight: 0.7, windWeight: 0.7, requiresDaylight: true },
  exercise: { idealTemp: 17, rainWeight: 1.1, uvWeight: 1.1, windWeight: 0.5 },
  event: { idealTemp: 23, rainWeight: 1.5, uvWeight: 0.8, windWeight: 1.1, requiresDaylight: true },
  photography: { idealTemp: 22, rainWeight: 0.9, uvWeight: 0.2, windWeight: 0.4, requiresDaylight: true },
  dining: { idealTemp: 23, rainWeight: 1.4, uvWeight: 0.6, windWeight: 1.2 },
  family: { idealTemp: 22, rainWeight: 1.3, uvWeight: 0.9, windWeight: 0.7, requiresDaylight: true },
  stargazing: { idealTemp: 16, rainWeight: 1.4, uvWeight: 0, windWeight: 0.4, requiresDark: true, requiresLowCloud: true },
  sunset: { idealTemp: 21, rainWeight: 0.8, uvWeight: 0, windWeight: 0.4 },
};

export function hourScore(h: HourPoint, profile: Profile, aqScore = 80): number {
  let score = 100;
  score -= Math.abs(h.feelsLike - profile.idealTemp) * 2.4;
  score -= (h.rainProbability / 100) * 45 * profile.rainWeight;
  score -= Math.max(0, h.uvIndex - 5) * 5 * profile.uvWeight;
  score -= Math.max(0, h.windSpeed - 18) * 1.6 * profile.windWeight;
  score -= Math.max(0, h.windGusts - 35) * 0.8;
  score -= Math.max(0, 70 - aqScore) * 0.35;
  if (h.visibility && h.visibility < 5) score -= 12;
  if (profile.requiresDaylight && !h.isDay) score -= 55;
  if (profile.requiresDark && h.isDay) score -= 70;
  if (profile.requiresLowCloud) score -= (h.cloudCover / 100) * 40;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface Window {
  start: number;
  end: number;
  score: number;
  label: string;
}

/** Finds the best contiguous window of `length` hours from the remaining part of the day. */
export function bestWindow(
  ctx: NormalizedContext,
  profileKey: keyof typeof PROFILES | Profile,
  length = 3,
  fromHour?: number,
): Window {
  const profile = typeof profileKey === "string" ? PROFILES[profileKey]! : profileKey;
  const aq = ctx.airQuality.aqiScore ?? 80;
  const startHour = fromHour ?? Number(ctx.time.slice(0, 2));
  const pool = ctx.todayHours.filter((h) => h.hour >= startHour);
  const hours = pool.length >= length ? pool : ctx.todayHours;
  let best: Window = { start: startHour, end: startHour + length, score: 0, label: "" };
  for (let i = 0; i + length <= hours.length; i++) {
    const slice = hours.slice(i, i + length);
    const score = Math.round(
      slice.reduce((sum, h) => sum + hourScore(h, profile, aq), 0) / slice.length,
    );
    if (score > best.score) {
      const first = slice[0]!;
      const last = slice[slice.length - 1]!;
      best = { start: first.hour, end: last.hour + 1, score, label: fmtRange(first.hour, last.hour + 1) };
    }
  }
  if (!best.label) best.label = fmtRange(best.start, best.end);
  return best;
}

export function hoursBetween(ctx: NormalizedContext, start: number, end: number): HourPoint[] {
  const slice = ctx.todayHours.filter((h) => h.hour >= start && h.hour < Math.max(end, start + 1));
  return slice.length ? slice : ctx.todayHours;
}

export function peak<T>(items: T[], value: (t: T) => number): T | undefined {
  return items.reduce<T | undefined>((acc, item) => {
    if (!acc || value(item) > value(acc)) return item;
    return acc;
  }, undefined);
}

export function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function verdictFromScore(score: number): Verdict {
  if (score >= 75) return "GO";
  if (score >= 58) return "CAUTION";
  if (score >= 40) return "WAIT";
  return "AVOID";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "EXCELLENT CONDITIONS";
  if (score >= 72) return "GOOD TO PROCEED — WITH PREPARATION";
  if (score >= 55) return "WORKABLE — PLAN AROUND THE RISKS";
  if (score >= 38) return "DIFFICULT — CONSIDER MOVING IT";
  return "NOT RECOMMENDED OUTDOORS";
}

export function confidenceFor(ctx: NormalizedContext): "High" | "Medium" | "Low" {
  if (ctx.mode === "demo") return "Low";
  if (!ctx.airQuality.available) return "Medium";
  return "High";
}

/** Risk set derived from an hour range of real data. */
export function buildRisks(ctx: NormalizedContext, hours: HourPoint[]): Risk[] {
  const rainMax = Math.max(...hours.map((h) => h.rainProbability), 0);
  const rainHour = peak(hours, (h) => h.rainProbability);
  const feelsMax = Math.max(...hours.map((h) => h.feelsLike), -50);
  const feelsMin = Math.min(...hours.map((h) => h.feelsLike), 60);
  const uvMax = Math.max(...hours.map((h) => h.uvIndex), 0);
  const windMax = Math.max(...hours.map((h) => h.windSpeed), 0);
  const gustMax = Math.max(...hours.map((h) => h.windGusts), 0);
  const aq = ctx.airQuality;

  const risks: Risk[] = [
    {
      name: "Rain",
      level: level(rainMax, 35, 60),
      reason:
        rainMax < 15
          ? `Rain probability stays at or below ${Math.round(rainMax)}% across the window.`
          : `Probability peaks at ${Math.round(rainMax)}% around ${pad(rainHour?.hour ?? 0)}:00.`,
    },
    {
      name: "Heat",
      level: level(feelsMax, 28, 33),
      reason:
        feelsMax >= 28
          ? `Feels-like temperature reaches ${Math.round(feelsMax)}°C at its peak.`
          : `Feels-like temperature stays between ${Math.round(feelsMin)}°C and ${Math.round(feelsMax)}°C.`,
    },
    {
      name: "Wind",
      level: level(Math.max(windMax, gustMax * 0.7), 22, 34),
      reason: `Sustained wind up to ${Math.round(windMax)} km/h with gusts near ${Math.round(gustMax)} km/h.`,
    },
    {
      name: "UV",
      level: level(uvMax, 6, 8),
      reason:
        uvMax <= 2
          ? "UV stays low through the window."
          : `UV index peaks at ${uvMax.toFixed(1)} — exposed skin burns faster around midday.`,
    },
    {
      name: "Air quality",
      level: aq.available ? level(100 - (aq.aqiScore ?? 80), 35, 60) : "Medium",
      reason: aq.available
        ? `${aq.aqiLabel} — PM2.5 at ${aq.measurements.find((m) => m.parameter === "PM2.5")?.value ?? "n/a"} µg/m³.`
        : "Air quality data unavailable for this location.",
    },
  ];
  return risks;
}

export function dataUsed(ctx: NormalizedContext): string[] {
  const used = ["Weather"];
  if (ctx.airQuality.available) used.push("Air Quality");
  used.push("Sun", "Location");
  return used;
}

export function tempWord(feelsLike: number): string {
  if (feelsLike >= 33) return "hot";
  if (feelsLike >= 27) return "warm";
  if (feelsLike >= 19) return "mild";
  if (feelsLike >= 12) return "cool";
  if (feelsLike >= 5) return "cold";
  return "very cold";
}

export function stateWord(ctx: NormalizedContext): string {
  switch (ctx.current.state) {
    case "clear":
      return "clear skies";
    case "partly-cloudy":
      return "broken cloud";
    case "overcast":
      return "full cloud cover";
    case "fog":
      return "fog and reduced visibility";
    case "rain":
      return "active rainfall";
    case "thunderstorm":
      return "storm activity";
    case "snow":
      return "snowfall";
  }
}
