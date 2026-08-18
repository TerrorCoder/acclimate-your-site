export type WeatherState =
  | "clear"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "rain"
  | "thunderstorm"
  | "snow";

export type DayPhase = "dawn" | "morning" | "afternoon" | "golden" | "dusk" | "night";

export interface LocationInfo {
  name: string;
  admin?: string | undefined;
  country?: string | undefined;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  rainProbability: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  uvIndex: number;
  visibility: number;
  isDay: boolean;
  state: WeatherState;
  description: string;
}

export interface HourPoint {
  time: string; // ISO local
  hour: number;
  label: string;
  temperature: number;
  feelsLike: number;
  rainProbability: number;
  precipitation: number;
  cloudCover: number;
  windSpeed: number;
  windGusts: number;
  uvIndex: number;
  humidity: number;
  visibility: number;
  weatherCode: number;
  state: WeatherState;
  isDay: boolean;
}

export interface DayPoint {
  date: string;
  weekday: string;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  precipitation: number;
  uvIndexMax: number;
  windMax: number;
  weatherCode: number;
  state: WeatherState;
  sunrise: string;
  sunset: string;
}

export interface AirQuality {
  available: boolean;
  source?: string | undefined;
  aqiLabel?: string | undefined;
  aqiScore?: number | undefined; // 0-100 quality score, higher = cleaner
  measurements: { parameter: string; value: number; unit: string }[];
  stationName?: string | undefined;
  updatedAt?: string | undefined;
}

export interface SunData {
  sunrise: string;
  sunset: string;
  dawn?: string | undefined;
  dusk?: string | undefined;
  goldenHour?: string | undefined;
  dayLength?: string | undefined;
  solarNoon?: string | undefined;
  source: string;
}

export interface MoonData {
  available: boolean;
  phase?: string | undefined;
  illumination?: number | undefined;
  moonrise?: string | undefined;
  moonset?: string | undefined;
}

export interface EventDetails {
  name: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string;
  people: number;
  outdoor: boolean;
  type: string;
}

export interface NormalizedContext {
  mode: "live" | "demo";
  fetchedAt: string;
  location: LocationInfo;
  date: string;
  time: string;
  timezone: string;
  current: CurrentWeather;
  hourly: HourPoint[];
  todayHours: HourPoint[];
  daily: DayPoint[];
  airQuality: AirQuality;
  sun: SunData;
  moon: MoonData;
  sources: string[];
  degraded: string[];
  selectedActivity?: string | undefined;
  eventDetails?: EventDetails | undefined;
}

export type TaskType =
  | "daily_brief"
  | "event_readiness"
  | "outfit"
  | "food"
  | "ask_ai"
  | "insight"
  | "activity";

export type Verdict = "GO" | "WAIT" | "CAUTION" | "AVOID";
export type Level = "Low" | "Medium" | "High";

export interface Risk {
  name: string;
  level: Level;
  reason: string;
}

export interface StructuredResponse {
  title?: string | undefined;
  recommendation: Verdict;
  confidence: "High" | "Medium" | "Low";
  bestTime: string;
  mainConsideration: string;
  risks: Risk[];
  whatToDo: string[];
  why: string;
  dataUsed: string[];
  score?: number | undefined;
  scoreLabel?: string | undefined;
  extras?: Record<string, string[] | string> | undefined;
}
