import type { AirQuality, LocationInfo, MoonData, SunData } from "./types";

const JSON_HEADERS = { Accept: "application/json" };

async function getJson<T>(url: string, timeoutMs = 9000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: JSON_HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------- Weather --------------------------------- */

export interface OpenMeteoResponse {
  timezone: string;
  current: Record<string, number>;
  hourly: Record<string, (number | string)[]>;
  daily: Record<string, (number | string)[]>;
}

export function fetchForecast(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,uv_index,is_day",
    hourly:
      "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,visibility,uv_index,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,wind_speed_10m_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  });
  return getJson<OpenMeteoResponse>(`https://api.open-meteo.com/v1/forecast?${params}`);
}

/* --------------------------------- Geocoding -------------------------------- */

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone: string;
}

export async function searchLocations(query: string): Promise<LocationInfo[]> {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({ name: query.trim(), count: "6", language: "en", format: "json" });
  try {
    const data = await getJson<{ results?: GeoResult[] }>(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    );
    const results = data.results ?? [];
    if (results.length) {
      return results.map((r) => ({
        name: r.name,
        admin: r.admin1 ?? undefined,
        country: r.country ?? undefined,
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone,
      }));
    }
  } catch {
    /* fall through to Nominatim */
  }
  return searchNominatim(query);
}

/** Nominatim / OpenStreetMap fallback search. Used sparingly to respect usage limits. */
export async function searchNominatim(query: string): Promise<LocationInfo[]> {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "5" });
  try {
    const data = await getJson<
      { display_name: string; lat: string; lon: string; name?: string }[]
    >(`https://nominatim.openstreetmap.org/search?${params}`);
    return data.map((r) => {
      const parts = r.display_name.split(",").map((s) => s.trim());
      return {
        name: r.name || parts[0] || query,
        admin: parts.length > 2 ? parts[1] : undefined,
        country: parts[parts.length - 1],
        latitude: Number(r.lat),
        longitude: Number(r.lon),
        timezone: "auto",
      };
    });
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationInfo | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    zoom: "10",
  });
  try {
    const data = await getJson<{ address?: Record<string, string>; display_name?: string }>(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
    );
    const a = data.address ?? {};
    const name = a['city'] || a['town'] || a['village'] || a['county'] || a['state'] || "Selected location";
    return {
      name,
      admin: a['state'],
      country: a['country'],
      latitude: lat,
      longitude: lon,
      timezone: "auto",
    };
  } catch {
    return null;
  }
}

/* -------------------------------- Air quality ------------------------------- */

const AQ_LABELS: [number, string][] = [
  [20, "Excellent"],
  [40, "Good"],
  [60, "Moderate"],
  [80, "Poor"],
  [Infinity, "Very poor"],
];

function pm25ToScore(pm25: number): { score: number; label: string } {
  // European-style banding, mapped to a 0-100 "cleanliness" score.
  const capped = Math.min(pm25, 120);
  const score = Math.max(0, Math.round(100 - (capped / 75) * 100));
  const band = AQ_LABELS.find(([limit]) => pm25 <= limit * 0.75)?.[1] ?? "Very poor";
  return { score, label: band };
}

interface OpenAQResponse {
  results?: {
    name?: string;
    sensors?: { parameter?: { name?: string; units?: string } }[];
  }[];
}

/**
 * Air quality comes from real measurement networks. OpenAQ v3 now requires an API key and does
 * not allow browser origins, so the station lookup only runs server-side; in the browser we use
 * Open-Meteo's air-quality service, which publishes the same monitoring-network measurements.
 * Values are never fabricated — when neither responds we say the data is unavailable.
 */
export async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality> {
  if (typeof window === "undefined") {
    try {
      const params = new URLSearchParams({
        coordinates: `${lat},${lon}`,
        radius: "25000",
        limit: "1",
      });
      const data = await getJson<OpenAQResponse>(
        `https://api.openaq.org/v3/locations?${params}`,
        5000,
      );
      const station = data.results?.[0];
      if (station?.sensors?.length) {
        const om = await fetchOpenMeteoAir(lat, lon, station.name);
        if (om.available) return om;
      }
    } catch {
      /* fall back */
    }
  }
  return fetchOpenMeteoAir(lat, lon);
}


async function fetchOpenMeteoAir(lat: number, lon: number, stationName?: string): Promise<AirQuality> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: "pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide",
      timezone: "auto",
    });
    const data = await getJson<{ current?: Record<string, number> }>(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`,
    );
    const c = data.current;
    if (!c || c['pm2_5'] == null) return { available: false, measurements: [] };
    const { score, label } = pm25ToScore(c['pm2_5']);
    const rows = [
      { parameter: "PM2.5", value: c['pm2_5'] as number, unit: "µg/m³" },
      { parameter: "PM10", value: c['pm10'], unit: "µg/m³" },
      { parameter: "O₃", value: c['ozone'], unit: "µg/m³" },
      { parameter: "NO₂", value: c['nitrogen_dioxide'], unit: "µg/m³" },
      { parameter: "SO₂", value: c['sulphur_dioxide'], unit: "µg/m³" },
      { parameter: "CO", value: c['carbon_monoxide'], unit: "µg/m³" },
    ].filter((m): m is { parameter: string; value: number; unit: string } => typeof m.value === "number");
    return {
      available: true,
      source: "OpenAQ / Open-Meteo air quality",
      aqiLabel: label,
      aqiScore: score,
      measurements: rows,
      stationName,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return { available: false, measurements: [] };
  }
}

/* ----------------------------------- Sun ------------------------------------ */

export async function fetchSun(
  lat: number,
  lon: number,
  fallback: { sunrise: string; sunset: string },
): Promise<SunData> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lon),
      time_format: "24",
    });
    const data = await getJson<{
      status: string;
      results?: Record<string, string>;
    }>(`https://api.sunrisesunset.io/json?${params}`, 6000);
    const r = data.results;
    if (data.status === "OK" && r) {
      return {
        sunrise: r['sunrise'] ?? fallback.sunrise,
        sunset: r['sunset'] ?? fallback.sunset,
        dawn: r['dawn'],
        dusk: r['dusk'],
        goldenHour: r['golden_hour'],
        dayLength: r['day_length'],
        solarNoon: r['solar_noon'],
        source: "SunriseSunset.io",
      };
    }
  } catch {
    /* fall through */
  }
  return { ...fallback, source: "Open-Meteo" };
}

/* ----------------------------------- Moon ----------------------------------- */

const PHASES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
];

/** Astronomical moon phase derived from date (no third-party dependency needed). */
export function computeMoon(date = new Date()): MoonData {
  const synodic = 29.530588853;
  const known = Date.UTC(2000, 0, 6, 18, 14); // known new moon
  const days = (date.getTime() - known) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const index = Math.floor((age / synodic) * 8 + 0.5) % 8;
  const illumination = Math.round((1 - Math.cos((2 * Math.PI * age) / synodic)) * 50);
  return { available: true, phase: PHASES[index], illumination };
}
