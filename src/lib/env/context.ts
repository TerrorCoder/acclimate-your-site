import {
  computeMoon,
  fetchAirQuality,
  fetchForecast,
  fetchSun,
  type OpenMeteoResponse,
} from "./sources";
import { describeCode, stateFromCode } from "./weatherCodes";
import type {
  DayPoint,
  HourPoint,
  LocationInfo,
  NormalizedContext,
} from "./types";

const num = (v: unknown, fallback = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : fallback);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function localNow(timezone: string): Date {
  try {
    return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  } catch {
    return new Date();
  }
}

function buildHours(raw: OpenMeteoResponse["hourly"]): HourPoint[] {
  const times = (raw["time"] ?? []) as string[];
  return times.map((t, i) => {
    const code = num(raw["weather_code"]?.[i]);
    const cloud = num(raw["cloud_cover"]?.[i]);
    const hour = Number(t.slice(11, 13));
    return {
      time: t,
      hour,
      label: `${pad(hour)}:00`,
      temperature: num(raw["temperature_2m"]?.[i]),
      feelsLike: num(raw["apparent_temperature"]?.[i]),
      rainProbability: num(raw["precipitation_probability"]?.[i]),
      precipitation: num(raw["precipitation"]?.[i]),
      cloudCover: cloud,
      windSpeed: num(raw["wind_speed_10m"]?.[i]),
      windGusts: num(raw["wind_gusts_10m"]?.[i]),
      uvIndex: num(raw["uv_index"]?.[i]),
      humidity: num(raw["relative_humidity_2m"]?.[i]),
      visibility: num(raw["visibility"]?.[i]) / 1000,
      weatherCode: code,
      state: stateFromCode(code, cloud),
      isDay: num(raw["is_day"]?.[i]) === 1,
    };
  });
}

function buildDays(raw: OpenMeteoResponse["daily"]): DayPoint[] {
  const dates = (raw["time"] ?? []) as string[];
  return dates.map((d, i) => {
    const code = num(raw["weather_code"]?.[i]);
    return {
      date: d,
      weekday: new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
      tempMax: num(raw["temperature_2m_max"]?.[i]),
      tempMin: num(raw["temperature_2m_min"]?.[i]),
      rainProbability: num(raw["precipitation_probability_max"]?.[i]),
      precipitation: num(raw["precipitation_sum"]?.[i]),
      uvIndexMax: num(raw["uv_index_max"]?.[i]),
      windMax: num(raw["wind_speed_10m_max"]?.[i]),
      weatherCode: code,
      state: stateFromCode(code),
      sunrise: String(raw["sunrise"]?.[i] ?? ""),
      sunset: String(raw["sunset"]?.[i] ?? ""),
    };
  });
}

export async function buildContext(location: LocationInfo): Promise<NormalizedContext> {
  const degraded: string[] = [];
  const forecast = await fetchForecast(location.latitude, location.longitude);

  const timezone = forecast.timezone || location.timezone;
  const hourly = buildHours(forecast.hourly);
  const daily = buildDays(forecast.daily);
  const today = daily[0];
  const now = localNow(timezone);
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const todayHours = hourly.filter((h) => h.time.startsWith(todayKey));

  const c = forecast.current ?? {};
  const code = num(c["weather_code"]);
  const cloud = num(c["cloud_cover"]);

  const [airQuality, sun] = await Promise.all([
    fetchAirQuality(location.latitude, location.longitude),
    fetchSun(location.latitude, location.longitude, {
      sunrise: (today?.sunrise ?? "").slice(11, 16),
      sunset: (today?.sunset ?? "").slice(11, 16),
    }),
  ]);

  if (!airQuality.available) degraded.push("Air quality data unavailable");

  const sources = [
    "Open-Meteo",
    airQuality.available ? (airQuality.source ?? "OpenAQ") : null,
    sun.source,
    "OpenStreetMap / Nominatim",
  ].filter(Boolean) as string[];

  return {
    mode: "live",
    fetchedAt: new Date().toISOString(),
    location: { ...location, timezone },
    date: todayKey,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    timezone,
    current: {
      temperature: num(c["temperature_2m"]),
      feelsLike: num(c["apparent_temperature"]),
      humidity: num(c["relative_humidity_2m"]),
      precipitation: num(c["precipitation"]),
      rainProbability: todayHours.find((h) => h.hour === now.getHours())?.rainProbability ?? 0,
      weatherCode: code,
      cloudCover: cloud,
      windSpeed: num(c["wind_speed_10m"]),
      windDirection: num(c["wind_direction_10m"]),
      windGusts: num(c["wind_gusts_10m"]),
      uvIndex: num(c["uv_index"]),
      visibility: num(c["visibility"]) / 1000,
      isDay: num(c["is_day"]) === 1,
      state: stateFromCode(code, cloud),
      description: describeCode(code),
    },
    hourly,
    todayHours: todayHours.length ? todayHours : hourly.slice(0, 24),
    daily,
    airQuality,
    sun,
    moon: computeMoon(now),
    sources,
    degraded,
  };
}
