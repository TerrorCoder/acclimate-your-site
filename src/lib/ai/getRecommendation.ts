import type {
  NormalizedContext,
  StructuredResponse,
  TaskType,
} from "../env/types";
import {
  avg,
  bestWindow,
  buildRisks,
  confidenceFor,
  dataUsed,
  fmtRange,
  hoursBetween,
  pad,
  peak,
  scoreLabel,
  stateWord,
  tempWord,
  verdictFromScore,
} from "./reasoning";
import { executeAIInference } from "./aiProvider";
import {
  buildDailyBriefPrompt,
  buildActivityPrompt,
  buildEventReadinessPrompt,
  buildOutfitPrompt,
  buildFoodPrompt,
  buildInsightPrompt,
  buildAskAiPrompt,
  buildDayPartsPrompt,
} from "./prompts";

export interface RecommendationOptions {
  activity?: string;
  question?: string;
  formality?: "Casual" | "Smart casual" | "Formal";
  indoor?: boolean;
  timeOverride?: { start: string; end: string };
  date?: string;
  /** Internal: prior chat messages for multi-turn AskAI */
  chatHistory?: { role: "user" | "assistant"; content: string }[];
}

/**
 * The single AI integration point for the whole product.
 *
 * Priority:
 *  1. Call live AI model (Gemini 2.0 Flash / OpenAI GPT-4o-mini) with grounded system prompt
 *  2. If AI model is unavailable or key is missing → fallback to deterministic engine safely.
 */
export async function getRecommendation(
  taskType: TaskType,
  context: NormalizedContext,
  options: RecommendationOptions = {},
): Promise<StructuredResponse> {
  // ── Tier 1: Try Live AI Model (Gemini / OpenAI) ───────────────────────────
  const aiResult = await tryLiveAI(taskType, context, options);
  if (aiResult) return aiResult;

  // ── Tier 2: Deterministic fallback ─────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 150));

  switch (taskType) {
    case "daily_brief":
      return dailyBrief(context);
    case "activity":
      return activity(context, options.activity ?? "Go Outside");
    case "event_readiness":
      return eventReadiness(context, options);
    case "outfit":
      return outfit(context, options);
    case "food":
      return food(context);
    case "insight":
      return insight(context);
    case "day_parts":
      return dayPartsFallback(context);
    case "ask_ai":
      return askAi(context, options.question ?? "");
  }
}

/* -------------------------------------------------------------------------- */
/*  Live AI Integration (Gemini / OpenAI)                                     */
/* -------------------------------------------------------------------------- */

async function tryLiveAI(
  taskType: TaskType,
  context: NormalizedContext,
  options: RecommendationOptions,
): Promise<StructuredResponse | null> {
  try {
    let systemPrompt: string;

    switch (taskType) {
      case "daily_brief":
        systemPrompt = buildDailyBriefPrompt(context);
        break;
      case "activity":
        systemPrompt = buildActivityPrompt(context, options.activity ?? "Go Outside");
        break;
      case "event_readiness":
        systemPrompt = buildEventReadinessPrompt(context, options);
        break;
      case "outfit":
        systemPrompt = buildOutfitPrompt(context, options);
        break;
      case "food":
        systemPrompt = buildFoodPrompt(context);
        break;
      case "insight":
        systemPrompt = buildInsightPrompt(context);
        break;
      case "day_parts":
        systemPrompt = buildDayPartsPrompt(context);
        break;
      case "ask_ai":
        systemPrompt = buildAskAiPrompt(
          context,
          options.question ?? "",
          options.chatHistory ?? [],
        );
        break;
      default:
        return null;
    }

    const { text, provider } = await executeAIInference(
      systemPrompt,
      taskType === "ask_ai" ? (options.question ?? "Analyze today") : "Generate the JSON response now.",
      options.chatHistory ?? [],
    );

    if (!text || provider === "fallback") return null;

    const parsed = JSON.parse(text);

    // Special handling for day_parts task
    if (taskType === "day_parts") {
      const parts: Record<string, string> = {
        Morning: parsed.Morning || parsed.morning || "Pleasant morning atmospheric progression.",
        Afternoon: parsed.Afternoon || parsed.afternoon || "Peak solar load and thermal shifts.",
        Evening: parsed.Evening || parsed.evening || "Cooling curve setting in towards dusk.",
        Night: parsed.Night || parsed.night || "Settled nocturnal conditions.",
      };
      return {
        title: "Across the day",
        recommendation: "GO",
        confidence: confidenceFor(context),
        bestTime: "06:00–22:00",
        mainConsideration: "Atmospheric shifts across morning, afternoon, evening, and night",
        risks: buildRisks(context, context.todayHours),
        whatToDo: Object.entries(parts).map(([k, v]) => `${k}: ${v}`),
        why: "Live AI multi-period atmospheric analysis.",
        dataUsed: dataUsed(context),
        extras: parts,
        aiPowered: true,
        aiProvider: provider,
      };
    }

    // Validate standard fields
    if (
      !parsed.recommendation ||
      !parsed.bestTime ||
      !Array.isArray(parsed.risks) ||
      !Array.isArray(parsed.whatToDo) ||
      !parsed.why
    ) {
      return null;
    }

    return {
      title: parsed.title ?? "AI Recommendation",
      recommendation: parsed.recommendation,
      confidence: parsed.confidence ?? confidenceFor(context),
      bestTime: parsed.bestTime,
      mainConsideration: parsed.mainConsideration ?? "",
      risks: parsed.risks,
      whatToDo: parsed.whatToDo,
      why: parsed.why,
      dataUsed: parsed.dataUsed ?? dataUsed(context),
      score: typeof parsed.score === "number" ? parsed.score : undefined,
      scoreLabel: parsed.scoreLabel,
      extras: parsed.extras,
      aiPowered: true,
      aiProvider: provider,
    };
  } catch (err) {
    console.warn("[Acclimate/AI] Live AI parse error, using fallback:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Deterministic fallback engine                                             */
/* -------------------------------------------------------------------------- */

const ACTIVITY_PROFILE: Record<string, string> = {
  "Go Outside": "outdoors",
  Exercise: "exercise",
  "Have an Event": "event",
  "Take Photos": "photography",
  "Eat Outside": "dining",
  "Family Day": "family",
  Stargaze: "stargazing",
  "Watch Sunset": "sunset",
};

function hourNum(time: string) {
  return Number(time.slice(0, 2));
}

function dayPartsFallback(ctx: NormalizedContext): StructuredResponse {
  const parts: Record<string, string> = {
    Morning: "Crisp early progression transitioning from overnight lows into active daylight.",
    Afternoon: "Solar load peaks near midday; humidity and ambient temperature dictate usable outdoor comfort.",
    Evening: "Steady radiational cooling curves settle as dusk approaches sunset.",
    Night: "Nocturnal air stabilizes with cooling temperatures and minimal convective activity.",
  };
  return {
    title: "Across the day",
    recommendation: "GO",
    confidence: confidenceFor(ctx),
    bestTime: "06:00–22:00",
    mainConsideration: "Conditions shift across daylight hours",
    risks: buildRisks(ctx, ctx.todayHours),
    whatToDo: Object.values(parts),
    why: "Hour-by-hour atmospheric transitions.",
    dataUsed: dataUsed(ctx),
    extras: parts,
    aiPowered: false,
    aiProvider: "fallback",
  };
}

/* ------------------------------- daily brief ------------------------------- */

function dailyBrief(ctx: NormalizedContext): StructuredResponse {
  const outdoors = bestWindow(ctx, "outdoors", 3);
  const exercise = bestWindow(ctx, "exercise", 2);
  const event = bestWindow(ctx, "event", 4);
  const photo = bestWindow(ctx, "photography", 2);
  const rest = ctx.todayHours.filter((h) => h.hour >= hourNum(ctx.time));
  const hours = rest.length ? rest : ctx.todayHours;
  const risks = buildRisks(ctx, hours);
  const rainPeak = peak(hours, (h) => h.rainProbability);
  const hotPeak = peak(hours, (h) => h.feelsLike);
  const score = outdoors.score;

  const consideration =
    (rainPeak?.rainProbability ?? 0) >= 45
      ? `Rain risk climbs to ${Math.round(rainPeak!.rainProbability)}% around ${pad(rainPeak!.hour)}:00`
      : (hotPeak?.feelsLike ?? 0) >= 30
        ? `Afternoon heat peaks near ${Math.round(hotPeak!.feelsLike)}°C`
        : `Conditions stay steady with ${stateWord(ctx)}`;

  return {
    title: "Your Day at a Glance",
    recommendation: verdictFromScore(score),
    confidence: confidenceFor(ctx),
    bestTime: outdoors.label,
    mainConsideration: consideration,
    risks,
    whatToDo: [
      `Head outside during ${outdoors.label} — that's the most comfortable stretch left today.`,
      `Train or move between ${exercise.label}, when heat and UV load are lowest.`,
      (rainPeak?.rainProbability ?? 0) >= 40
        ? `Carry rain protection after ${pad(rainPeak!.hour)}:00 if you'll be out.`
        : `Sun protection matters more than rain protection today.`,
      `Photograph around ${photo.label} for the softest light.`,
    ],
    why: `It is currently ${Math.round(ctx.current.temperature)}°C (feels ${Math.round(ctx.current.feelsLike)}°C) with ${stateWord(ctx)}. ${consideration}, so the day's usable window sits earlier rather than later.`,
    dataUsed: dataUsed(ctx),
    score,
    scoreLabel: scoreLabel(score),
    extras: {
      "Best time to go outside": outdoors.label,
      "Best time to exercise": exercise.label,
      "Best time for outdoor events": event.label,
      "Best time for photography": photo.label,
      "What to wear": outfitLine(ctx),
      "What to prepare for": risks
        .filter((r) => r.level !== "Low")
        .map((r) => r.name)
        .join(" · ") || "Nothing significant",
    },
    aiPowered: false,
    aiProvider: "fallback",
  };
}

/* --------------------------------- activity -------------------------------- */

function activity(ctx: NormalizedContext, name: string): StructuredResponse {
  const key = ACTIVITY_PROFILE[name] ?? "outdoors";
  const length = key === "event" ? 4 : key === "sunset" ? 1 : 2;
  const win = bestWindow(ctx, key, length);
  const hours = hoursBetween(ctx, win.start, win.end);
  const risks = buildRisks(ctx, hours);
  const rainMax = Math.max(...hours.map((h) => h.rainProbability), 0);
  const feelsAvg = avg(hours.map((h) => h.feelsLike));

  const specifics: Record<string, string[]> = {
    "Go Outside": [
      `Aim for ${win.label} while it feels around ${Math.round(feelsAvg)}°C.`,
      rainMax > 40 ? "Take a light rain layer." : "Take water — you'll want it more than a jacket.",
      "Keep exposed time shorter when UV is above 6.",
    ],
    Exercise: [
      `Train between ${win.label} — the lowest combined heat and UV load today.`,
      "Hydrate before, not only during.",
      feelsAvg > 26 ? "Cut intensity by ~15% and pick shaded routes." : "Full-intensity sessions are comfortable.",
    ],
    "Have an Event": [
      `Schedule the outdoor portion inside ${win.label}.`,
      rainMax > 35 ? "Book cover or a fallback indoor space." : "Cover is optional but shade is not.",
      "Confirm a rain call time with your team.",
    ],
    "Take Photos": [
      `Shoot ${win.label} for directional, low-contrast light.`,
      `Golden hour is around ${ctx.sun.goldenHour ?? ctx.sun.sunset}.`,
      ctx.current.cloudCover > 60 ? "Diffuse cloud will flatten shadows — good for portraits." : "Expect hard shadows near midday.",
    ],
    "Eat Outside": [
      `Best seated window is ${win.label}.`,
      "Weigh down light items if gusts pick up.",
      rainMax > 40 ? "Choose a covered terrace." : "Open-air seating works.",
    ],
    "Family Day": [
      `Plan the outdoor block for ${win.label}.`,
      "Pack water, hats and one warm layer for later.",
      "Keep an indoor option for the last two hours.",
    ],
    Stargaze: [
      `Cloud cover is the deciding factor tonight — the clearest stretch is ${win.label}.`,
      `Moon is ${ctx.moon.phase ?? "unknown"} at ${ctx.moon.illumination ?? 0}% illumination.`,
      "Give your eyes 20 minutes to adapt away from direct light.",
    ],
    "Watch Sunset": [
      `Sunset is at ${ctx.sun.sunset}; arrive by ${pad(Math.max(0, hourNum(ctx.sun.sunset) - 1))}:30.`,
      ctx.current.cloudCover > 20 && ctx.current.cloudCover < 75
        ? "Broken cloud should light up well."
        : "Expect a clean, simple horizon.",
      "Bring a layer — temperature drops fast after dusk.",
    ],
  };

  return {
    title: name,
    recommendation: verdictFromScore(win.score),
    confidence: confidenceFor(ctx),
    bestTime: win.label,
    mainConsideration:
      rainMax >= 45
        ? `Rain probability reaches ${Math.round(rainMax)}% in this window`
        : feelsAvg >= 30
          ? `It feels around ${Math.round(feelsAvg)}°C during this window`
          : `Conditions suit ${name.toLowerCase()} well`,
    risks,
    whatToDo: specifics[name] ?? specifics["Go Outside"]!,
    why: `Across ${win.label} the environment averages ${Math.round(feelsAvg)}°C feels-like with a ${Math.round(rainMax)}% peak rain probability, which is ${win.score >= 70 ? "comfortably within" : "at the edge of"} the range this activity works best in.`,
    dataUsed: dataUsed(ctx),
    score: win.score,
    scoreLabel: scoreLabel(win.score),
    aiPowered: false,
    aiProvider: "fallback",
  };
}

/* ----------------------------- event readiness ----------------------------- */

function eventReadiness(ctx: NormalizedContext, options: RecommendationOptions): StructuredResponse {
  const details = ctx.eventDetails;
  const start = hourNum(options.timeOverride?.start ?? details?.startTime ?? "14:00");
  const end = hourNum(options.timeOverride?.end ?? details?.endTime ?? "20:00");
  const dayIndex = Math.max(
    0,
    ctx.daily.findIndex((d) => d.date === (options.date ?? details?.date ?? ctx.date)),
  );
  const dayKey = ctx.daily[dayIndex]?.date ?? ctx.date;
  const dayHours = ctx.hourly.filter((h) => h.time.startsWith(dayKey));
  const source = dayHours.length ? dayHours : ctx.todayHours;
  const hours = source.filter((h) => h.hour >= start && h.hour < Math.max(end, start + 1));
  const window = hours.length ? hours : source;

  const risks = buildRisks(ctx, window);
  const rainMax = Math.max(...window.map((h) => h.rainProbability), 0);
  const feelsMax = Math.max(...window.map((h) => h.feelsLike), 0);
  const gustMax = Math.max(...window.map((h) => h.windGusts), 0);
  const uvMax = Math.max(...window.map((h) => h.uvIndex), 0);
  const darkHours = window.filter((h) => !h.isDay).length;
  const people = details?.people ?? 40;

  let score = 100;
  score -= (rainMax / 100) * 48;
  score -= Math.max(0, feelsMax - 27) * 3.4;
  score -= Math.max(0, 15 - feelsMax) * 2.2;
  score -= Math.max(0, gustMax - 30) * 1.4;
  score -= Math.max(0, uvMax - 6) * 3;
  score -= darkHours * 3;
  if (ctx.airQuality.available) score -= Math.max(0, 70 - (ctx.airQuality.aqiScore ?? 80)) * 0.4;
  if (details && !details.outdoor) score = Math.min(100, score + 18);
  score = Math.max(4, Math.min(100, Math.round(score)));

  const better = bestWindow(ctx, "event", Math.max(2, Math.min(6, end - start)), 6);

  const recommendations = [
    rainMax >= 40 ? "Prepare covered space or marquee capacity for all guests." : "No dedicated rain cover needed, but keep a contingency.",
    feelsMax >= 29 ? "Provide shade and a visible water station — heat peaks mid-window." : "Standard refreshment setup is sufficient.",
    gustMax >= 30 ? "Secure signage, light furniture and any staging against gusts." : "Light décor will hold in the expected wind.",
    darkHours > 0 ? `Plan lighting from ${ctx.sun.sunset} onwards.` : "Daylight covers the full event window.",
    uvMax >= 7 ? "Move photography and speeches out of direct midday sun." : "UV exposure is manageable throughout.",
    people > 60 ? "Scale water and shade provision to the full headcount." : "Provision scales comfortably at this headcount.",
  ];

  return {
    title: details?.name ?? "Outdoor event",
    recommendation: verdictFromScore(score),
    confidence: confidenceFor(ctx),
    bestTime: better.label,
    mainConsideration:
      rainMax >= 40
        ? `Rain probability peaks at ${Math.round(rainMax)}% during the event window`
        : feelsMax >= 30
          ? `Feels-like temperature reaches ${Math.round(feelsMax)}°C during the event`
          : "No dominant risk in the chosen window",
    risks: [
      ...risks,
      {
        name: "Lighting",
        level: darkHours >= 3 ? "High" : darkHours > 0 ? "Medium" : "Low",
        reason: darkHours
          ? `${darkHours}h of the event falls after sunset (${ctx.sun.sunset}).`
          : `The full window sits between sunrise (${ctx.sun.sunrise}) and sunset (${ctx.sun.sunset}).`,
      },
    ],
    whatToDo: recommendations,
    why: `Between ${pad(start)}:00 and ${pad(end)}:00 the forecast shows a ${Math.round(rainMax)}% peak rain probability, ${Math.round(feelsMax)}°C peak feels-like temperature and gusts to ${Math.round(gustMax)} km/h. ${score >= 72 ? "That is workable with preparation." : "Those combine into meaningful disruption risk."}`,
    dataUsed: dataUsed(ctx),
    score,
    scoreLabel: scoreLabel(score),
    extras: {
      checklist: [
        rainMax >= 30 ? "Rain cover / marquee" : "Rain cover (contingency only)",
        feelsMax >= 27 ? "Shade structures" : "Light shade",
        "Water station",
        darkHours > 0 ? "Evening lighting" : "Daylight — no lighting required",
        "Guest clothing guidance",
        rainMax >= 55 ? "Backup indoor location" : "Backup location (optional)",
        "Food kept cool and covered",
      ],
      clothing: outfitLines(ctx, { formality: "Smart casual", indoor: false }),
    },
    aiPowered: false,
    aiProvider: "fallback",
  };
}

/* ---------------------------------- outfit --------------------------------- */

function outfitLine(ctx: NormalizedContext): string {
  const f = ctx.current.feelsLike;
  if (f >= 30) return "Lightweight, breathable layers and sun protection";
  if (f >= 24) return "Light clothing with a sun hat";
  if (f >= 18) return "Comfortable mid-weight layers";
  if (f >= 11) return "A warm layer with a wind-resistant shell";
  return "Insulated layers, hat and gloves";
}

function outfitLines(ctx: NormalizedContext, options: RecommendationOptions): string[] {
  const f = ctx.current.feelsLike;
  const rain = Math.max(...ctx.todayHours.map((h) => h.rainProbability), 0);
  const uv = Math.max(...ctx.todayHours.map((h) => h.uvIndex), 0);
  const wind = ctx.current.windSpeed;
  const formal = options.formality === "Formal";

  const clothing =
    f >= 30
      ? formal ? "Linen or lightweight wool suiting in a pale colour" : "Breathable t-shirt and light trousers or shorts"
      : f >= 22
        ? formal ? "Unlined blazer with a cotton shirt" : "Short sleeves with light long trousers"
        : f >= 15
          ? formal ? "Wool blazer over a long-sleeve shirt" : "Long sleeves plus a mid layer"
          : "Thermal base layer under a warm mid layer";

  const shoes =
    rain >= 45 ? "Water-resistant closed shoes" : f >= 27 ? "Breathable or open footwear" : "Closed comfortable shoes";
  const outer =
    rain >= 45 ? "Packable waterproof shell" : wind >= 25 ? "Wind-resistant light jacket" : f < 18 ? "Warm jacket" : "None needed";
  const accessories = [
    uv >= 6 ? "Sunglasses" : null,
    uv >= 6 ? "Wide-brim hat" : null,
    f < 12 ? "Scarf and gloves" : null,
    "Water bottle",
  ].filter(Boolean) as string[];

  return [
    `Clothing — ${clothing}`,
    `Shoes — ${shoes}`,
    `Outer layer — ${outer}`,
    `Accessories — ${accessories.join(", ")}`,
    `Rain protection — ${rain >= 45 ? `Yes, ${Math.round(rain)}% peak probability today` : rain >= 20 ? "Compact umbrella as a precaution" : "Not required today"}`,
    `Sun protection — ${uv >= 6 ? `SPF 30+, UV peaks at ${uv.toFixed(1)}` : uv >= 3 ? "Light SPF for extended exposure" : "Minimal UV exposure today"}`,
  ];
}

function outfit(ctx: NormalizedContext, options: RecommendationOptions): StructuredResponse {
  const lines = outfitLines(ctx, options);
  const win = bestWindow(ctx, options.activity === "Exercise" ? "exercise" : "outdoors", 3);
  const rain = Math.max(...ctx.todayHours.map((h) => h.rainProbability), 0);
  const risks = buildRisks(ctx, ctx.todayHours);
  const score = options.indoor ? Math.min(100, win.score + 15) : win.score;

  return {
    title: "What should I wear?",
    recommendation: verdictFromScore(score),
    confidence: confidenceFor(ctx),
    bestTime: win.label,
    mainConsideration: `Feels like ${Math.round(ctx.current.feelsLike)}°C with ${Math.round(rain)}% peak rain probability`,
    risks,
    whatToDo: lines,
    why: `Actual temperature is ${Math.round(ctx.current.temperature)}°C but it feels ${Math.round(ctx.current.feelsLike)}°C with ${Math.round(ctx.current.humidity)}% humidity and ${Math.round(ctx.current.windSpeed)} km/h wind${options.indoor ? ", and you'll be mostly indoors" : ""}. That combination is what drives the layer and protection choices above${options.activity ? ` for ${options.activity.toLowerCase()}` : ""}.`,
    dataUsed: dataUsed(ctx),
    score,
    scoreLabel: `${tempWord(ctx.current.feelsLike).toUpperCase()} · ${options.formality ?? "Casual"}`,
    aiPowered: false,
    aiProvider: "fallback",
  };
}

/* ----------------------------------- food ---------------------------------- */

function food(ctx: NormalizedContext): StructuredResponse {
  const f = ctx.current.feelsLike;
  const rain = Math.max(...ctx.todayHours.map((h) => h.rainProbability), 0);
  const suggestions =
    f >= 30
      ? ["Light, cooling meals — salads, cold noodles, fruit", "Hydrating foods with high water content", "Eat the heaviest meal after the heat peak"]
      : f >= 22
        ? [rain < 35 ? "Grilled or picnic-style food works outdoors today" : "Picnic food, but eat under cover", "Cold drinks and fresh sides", "Keep prepared food shaded"]
        : f >= 14
          ? ["Warm, substantial meals suit the temperature", "Soups or roasted dishes late in the day", "Hot drinks for the evening drop"]
          : ["Warming, slow-cooked meals", "Hot drinks through the day", "Higher-energy food for cold exposure"];

  return {
    title: "What should I eat today?",
    recommendation: "GO",
    confidence: confidenceFor(ctx),
    bestTime: bestWindow(ctx, "dining", 2).label,
    mainConsideration: `${tempWord(f)} conditions at ${Math.round(f)}°C feels-like`,
    risks: [
      { name: "Heat", level: f >= 30 ? "High" : f >= 26 ? "Medium" : "Low", reason: `Feels-like ${Math.round(f)}°C affects appetite and food safety outdoors.` },
      { name: "Rain", level: rain >= 55 ? "High" : rain >= 30 ? "Medium" : "Low", reason: `Peak rain probability today is ${Math.round(rain)}%.` },
    ],
    whatToDo: suggestions,
    why: `At ${Math.round(f)}°C feels-like with ${Math.round(ctx.current.humidity)}% humidity, ${f >= 27 ? "lighter, hydrating food is easier to handle" : "warmer food matches the conditions better"}.`,
    dataUsed: dataUsed(ctx),
    aiPowered: false,
    aiProvider: "fallback",
  };
}

/* --------------------------------- insight --------------------------------- */

function insight(ctx: NormalizedContext): StructuredResponse {
  const days = ctx.daily;
  const scored = days.map((d) => ({
    d,
    score: Math.round(
      100 -
        (d.rainProbability / 100) * 50 -
        Math.abs(d.tempMax - 24) * 2 -
        Math.max(0, d.uvIndexMax - 7) * 3 -
        Math.max(0, d.windMax - 22) * 1.2,
    ),
  }));
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a), scored[0]!);
  const worst = scored.reduce((a, b) => (b.score < a.score ? b : a), scored[0]!);
  const wetHours = ctx.todayHours.filter((h) => h.rainProbability >= 45).map((h) => h.hour);
  const morning = avg(ctx.todayHours.filter((h) => h.hour >= 6 && h.hour < 12).map((h) => h.rainProbability));
  const afternoon = avg(ctx.todayHours.filter((h) => h.hour >= 12 && h.hour < 18).map((h) => h.rainProbability));
  const trend = (days[days.length - 1]?.tempMax ?? 0) - (days[0]?.tempMax ?? 0);

  const insights = [
    wetHours.length
      ? `Rain risk is concentrated between ${pad(Math.min(...wetHours))}:00 and ${pad(Math.max(...wetHours) + 1)}:00 today.`
      : `No hour today exceeds a ${Math.round(Math.max(...ctx.todayHours.map((h) => h.rainProbability), 0))}% rain probability.`,
    `${best.d.weekday} currently has the most favourable outdoor conditions this week (${best.d.tempMax.toFixed(0)}°C max, ${Math.round(best.d.rainProbability)}% rain).`,
    morning < afternoon
      ? `Morning conditions are more favourable than afternoon conditions — average rain probability ${Math.round(morning)}% versus ${Math.round(afternoon)}%.`
      : `Afternoon conditions improve on the morning — average rain probability drops from ${Math.round(morning)}% to ${Math.round(afternoon)}%.`,
    `Temperatures ${trend > 2 ? "climb" : trend < -2 ? "ease back" : "stay flat"} by about ${Math.abs(Math.round(trend))}°C across the week; ${worst.d.weekday} looks the most disrupted.`,
  ];

  return {
    title: "Weekly outlook",
    recommendation: verdictFromScore(best.score),
    confidence: confidenceFor(ctx),
    bestTime: `${best.d.weekday}`,
    mainConsideration: `${worst.d.weekday} carries the week's highest disruption risk`,
    risks: buildRisks(ctx, ctx.todayHours),
    whatToDo: insights,
    why: `Across the 7-day forecast, daily maxima range from ${Math.min(...days.map((d) => d.tempMin)).toFixed(0)}°C to ${Math.max(...days.map((d) => d.tempMax)).toFixed(0)}°C with rain probability peaking at ${Math.max(...days.map((d) => d.rainProbability))}%.`,
    dataUsed: dataUsed(ctx),
    score: best.score,
    scoreLabel: scoreLabel(best.score),
    aiPowered: false,
    aiProvider: "fallback",
  };
}

/* ---------------------------------- ask ai --------------------------------- */

function askAi(ctx: NormalizedContext, question: string): StructuredResponse {
  const q = question.toLowerCase();
  if (/wear|outfit|dress|clothes/.test(q)) return { ...outfit(ctx, {}), title: question };
  if (/eat|food|meal|drink/.test(q)) return { ...food(ctx), title: question };
  if (/exercise|run|train|gym|workout/.test(q)) return { ...activity(ctx, "Exercise"), title: question };
  if (/picnic|eat outside|lunch outside/.test(q)) return { ...activity(ctx, "Eat Outside"), title: question };
  if (/photo|shoot|golden/.test(q)) return { ...activity(ctx, "Take Photos"), title: question };
  if (/star|night sky/.test(q)) return { ...activity(ctx, "Stargaze"), title: question };
  if (/sunset/.test(q)) return { ...activity(ctx, "Watch Sunset"), title: question };
  if (/event|party|wedding|outside/.test(q) && /event|party|wedding/.test(q))
    return { ...eventReadiness(ctx, {}), title: question };
  const moveMatch = q.match(/(\d{1,2})\s?(am|pm|:00)/);
  if (/move|instead|what if|change/.test(q) && moveMatch) {
    const raw = Number(moveMatch[1]);
    const start = moveMatch[2] === "pm" && raw < 12 ? raw + 12 : raw;
    return {
      ...eventReadiness(ctx, {
        timeOverride: { start: `${pad(start)}:00`, end: `${pad(Math.min(23, start + 6))}:00` },
      }),
      title: question,
    };
  }
  if (/tonight|evening/.test(q)) {
    const evening = ctx.todayHours.filter((h) => h.hour >= 18);
    const hours = evening.length ? evening : ctx.todayHours;
    const win = bestWindow(ctx, "outdoors", 2, 18);
    return {
      title: question,
      recommendation: verdictFromScore(win.score),
      confidence: confidenceFor(ctx),
      bestTime: win.label,
      mainConsideration: `Evening temperature settles near ${Math.round(avg(hours.map((h) => h.feelsLike)))}°C`,
      risks: buildRisks(ctx, hours),
      whatToDo: [
        `Expect ${Math.round(avg(hours.map((h) => h.rainProbability)))}% average rain probability this evening.`,
        `Take a layer — it drops to ${Math.round(Math.min(...hours.map((h) => h.feelsLike)))}°C.`,
        `Sunset is ${ctx.sun.sunset}, dusk ends ${ctx.sun.dusk ?? "shortly after"}.`,
      ],
      why: `Evening hours show ${stateWord(ctx)} with cooling temperatures and ${Math.round(avg(hours.map((h) => h.rainProbability)))}% average rain probability.`,
      dataUsed: dataUsed(ctx),
      score: win.score,
      scoreLabel: scoreLabel(win.score),
      aiPowered: false,
      aiProvider: "fallback",
    };
  }
  return { ...dailyBrief(ctx), title: question || "Your day" };
}

export const SUGGESTED_QUESTIONS = [
  "What should I wear today?",
  "Is today good for a picnic?",
  "When should I exercise?",
  "Should I hold my event outside?",
  "What should I prepare for tonight?",
  "What happens if I move my event to 10am?",
];
