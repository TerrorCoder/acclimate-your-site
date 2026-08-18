import type { Settings } from "./settings";

export function formatTemp(celsius: number, settings: Settings, withUnit = true): string {
  const value = settings.units === "imperial" || settings.tempUnit === "F" ? celsius * 1.8 + 32 : celsius;
  const unit = settings.tempUnit === "F" ? "°F" : "°C";
  return `${Math.round(value)}${withUnit ? unit : "°"}`;
}

export function formatSpeed(kmh: number, settings: Settings): string {
  if (settings.units === "imperial") return `${Math.round(kmh * 0.621371)} mph`;
  return `${Math.round(kmh)} km/h`;
}

export function formatDistance(km: number, settings: Settings): string {
  if (settings.units === "imperial") return `${Math.round(km * 0.621371)} mi`;
  return `${Math.round(km)} km`;
}

export function formatTime(hhmm: string, settings: Settings): string {
  const clean = hhmm.length > 5 ? hhmm.slice(11, 16) : hhmm;
  const [hStr, mStr = "00"] = clean.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return hhmm;
  if (settings.timeFormat === "24h") return `${String(h).padStart(2, "0")}:${mStr}`;
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr}${suffix}`;
}

export function formatRange(range: string, settings: Settings): string {
  if (settings.timeFormat === "24h") return range;
  return range
    .split(/[–-]/)
    .map((part) => formatTime(part.trim(), settings))
    .join(" – ");
}
