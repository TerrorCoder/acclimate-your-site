import { computeMoon } from "./sources";
import { describeCode, stateFromCode } from "./weatherCodes";
import type { DayPoint, HourPoint, NormalizedContext } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Clearly-labelled demo dataset. Only used when the public APIs cannot be reached,
 * and always surfaced in the UI as DEMO DATA — never presented as live.
 */
export function buildDemoContext(): NormalizedContext {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const hours: HourPoint[] = Array.from({ length: 24 }, (_, h) => {
    const temp = 18 + 11 * Math.sin(((h - 6) / 24) * Math.PI * 2) + (h > 12 ? 2 : 0);
    const rain = h >= 15 && h <= 19 ? 55 + (h - 15) * 6 : Math.max(4, 20 - Math.abs(12 - h) * 2);
    const code = rain > 60 ? 61 : h >= 13 ? 2 : 0;
    const cloud = rain > 60 ? 85 : h >= 13 ? 45 : 10;
    return {
      time: `${dateKey}T${pad(h)}:00`,
      hour: h,
      label: `${pad(h)}:00`,
      temperature: Math.round(temp * 10) / 10,
      feelsLike: Math.round((temp + 1.6) * 10) / 10,
      rainProbability: Math.round(rain),
      precipitation: rain > 60 ? 1.2 : 0,
      cloudCover: cloud,
      windSpeed: 9 + (h % 5),
      windGusts: 18 + (h % 7),
      uvIndex: h >= 9 && h <= 16 ? Math.max(1, 9 - Math.abs(12 - h) * 1.8) : 0,
      humidity: 48 + (h > 15 ? 22 : 0),
      visibility: rain > 60 ? 8 : 24,
      weatherCode: code,
      state: stateFromCode(code, cloud),
      isDay: h >= 6 && h <= 18,
    };
  });

  const daily: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + i * 86400000);
    const code = [2, 61, 0, 1, 3, 80, 0][i] ?? 0;
    return {
      date: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      tempMax: 27 + ((i * 3) % 5),
      tempMin: 15 + (i % 4),
      rainProbability: [45, 80, 10, 20, 35, 65, 15][i] ?? 20,
      precipitation: [1, 6, 0, 0, 2, 4, 0][i] ?? 0,
      uvIndexMax: [8, 4, 9, 8, 6, 5, 9][i] ?? 7,
      windMax: 14 + i,
      weatherCode: code,
      state: stateFromCode(code),
      sunrise: `${d.toISOString().slice(0, 10)}T06:12`,
      sunset: `${d.toISOString().slice(0, 10)}T18:04`,
    };
  });

  const current = hours[now.getHours()] ?? hours[12]!;

  return {
    mode: "demo",
    fetchedAt: new Date().toISOString(),
    location: {
      name: "Harare",
      admin: "Harare Province",
      country: "Zimbabwe",
      latitude: -17.8292,
      longitude: 31.0522,
      timezone: "Africa/Harare",
    },
    date: dateKey,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    timezone: "Africa/Harare",
    current: {
      temperature: current.temperature,
      feelsLike: current.feelsLike,
      humidity: current.humidity,
      precipitation: current.precipitation,
      rainProbability: current.rainProbability,
      weatherCode: current.weatherCode,
      cloudCover: current.cloudCover,
      windSpeed: current.windSpeed,
      windDirection: 120,
      windGusts: current.windGusts,
      uvIndex: current.uvIndex,
      visibility: current.visibility,
      isDay: current.isDay,
      state: current.state,
      description: describeCode(current.weatherCode),
    },
    hourly: hours,
    todayHours: hours,
    daily,
    airQuality: {
      available: true,
      source: "Demo dataset",
      aqiLabel: "Good",
      aqiScore: 78,
      measurements: [
        { parameter: "PM2.5", value: 11.4, unit: "µg/m³" },
        { parameter: "PM10", value: 19.2, unit: "µg/m³" },
        { parameter: "O₃", value: 62, unit: "µg/m³" },
        { parameter: "NO₂", value: 14, unit: "µg/m³" },
      ],
    },
    sun: {
      sunrise: "06:12",
      sunset: "18:04",
      dawn: "05:48",
      dusk: "18:28",
      goldenHour: "17:18",
      dayLength: "11:52:00",
      solarNoon: "12:08",
      source: "Demo dataset",
    },
    moon: computeMoon(now),
    sources: ["Demo dataset"],
    degraded: ["Live sources unreachable — showing demo data"],
  };
}
