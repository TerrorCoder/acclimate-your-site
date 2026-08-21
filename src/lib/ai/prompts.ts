/**
 * All prompt templates for GPT-4o-mini.
 *
 * Every prompt:
 *  - Grounds the model in the serialized NormalizedContext (real sensor data)
 *  - Instructs the model to return ONLY a JSON object matching StructuredResponse
 *  - Never asks the model to invent values not present in the context
 */

import type { NormalizedContext } from "../env/types";

interface RecommendationOptions {
  formality?: string;
  indoor?: boolean;
  activity?: string;
  timeOverride?: { start: string; end: string };
  date?: string;
}

const SCHEMA = `{
  "title": string,
  "recommendation": "GO" | "CAUTION" | "WAIT" | "AVOID",
  "confidence": "High" | "Medium" | "Low",
  "bestTime": "HH:MM–HH:MM string",
  "mainConsideration": string (1 sentence, factual),
  "risks": [{ "name": string, "level": "Low"|"Medium"|"High", "reason": string }],
  "whatToDo": [string] (3-5 specific, actionable items),
  "why": string (2-3 sentences explaining the reasoning from data),
  "dataUsed": [string],
  "score": number (0-100),
  "scoreLabel": string
}`;

function SYSTEM_BASE(ctx: NormalizedContext): string {
  return `You are an environmental intelligence assistant for Acclimate, a weather interpretation app.
Your role is to reason over real environmental sensor data and return structured, actionable insights.

RULES:
- Base every claim on the context data below. Never invent numbers.
- Write in second person (you/your). Be specific and concrete.
- Tone: calm, clear, expert. No fluff. No hedging unless genuinely uncertain.
- Return ONLY a single valid JSON object matching this schema:
${SCHEMA}
- "score" must be 0-100. Use the weather data to derive it proportionally.
- "recommendation" must follow: score>=75 → "GO", 58-74 → "CAUTION", 40-57 → "WAIT", <40 → "AVOID"
- "confidence": "High" if air quality available and mode is live, "Medium" if partial, "Low" if demo mode
- "dataUsed": list the actual data sources used from: Weather, Air Quality, Sun, Moon, Location

ENVIRONMENTAL CONTEXT (real data, do not modify):
${JSON.stringify(ctx, null, 2)}`;
}

export function buildDailyBriefPrompt(ctx: NormalizedContext): string {
  return `${SYSTEM_BASE(ctx)}

TASK: Generate a "daily_brief" for today (${ctx.date}) at ${ctx.location.name}.

Focus on:
1. The best time window to go outside (use hourly data to find it)
2. The dominant weather factor the user should plan around
3. 4 specific, different actions (outdoor timing, exercise timing, rain prep, sun/UV prep)
4. A "why" that explains current conditions and the main consideration in 2-3 sentences

Set "title" to "Your Day at a Glance".`;
}

export function buildActivityPrompt(ctx: NormalizedContext, activity: string): string {
  return `${SYSTEM_BASE(ctx)}

TASK: Generate an activity recommendation for "${activity}" today at ${ctx.location.name}.

Find the best 2-3 hour window in today's hourly data for this specific activity.
Give 3 specific preparation tips tailored to "${activity}".
Set "title" to "${activity}".`;
}

export function buildEventReadinessPrompt(ctx: NormalizedContext, options: RecommendationOptions): string {
  const event = ctx.eventDetails;
  const start = options.timeOverride?.start ?? event?.startTime ?? "14:00";
  const end = options.timeOverride?.end ?? event?.endTime ?? "20:00";
  const date = options.date ?? event?.date ?? ctx.date;

  return `${SYSTEM_BASE(ctx)}

TASK: Assess outdoor event readiness for "${event?.name ?? "Outdoor event"}" on ${date} from ${start}–${end} at ${ctx.location.name}.
Event has ${event?.people ?? 40} guests, type: ${event?.type ?? "Social"}, ${event?.outdoor ? "outdoor" : "indoor"}.

Analyse the hourly forecast for ${date} between ${start} and ${end}.
Provide 6 specific preparation recommendations covering: rain cover, shade/heat, wind, lighting, UV, catering.
Include a "checklist" key inside extras: array of 6-8 checklist items as strings.
Include a "clothing" key inside extras: array of 5-6 clothing guidance lines.
Set title to "${event?.name ?? "Outdoor event"}".`;
}

export function buildOutfitPrompt(ctx: NormalizedContext, options: RecommendationOptions): string {
  return `${SYSTEM_BASE(ctx)}

TASK: Generate outfit recommendations for today at ${ctx.location.name}.
Formality: ${options.formality ?? "Casual"}. ${options.indoor ? "Mostly indoors." : "Mostly outdoors."}
${options.activity ? `Activity: ${options.activity}.` : ""}

Provide 6 specific clothing lines: Clothing, Shoes, Outer layer, Accessories, Rain protection, Sun protection.
Each line format: "Category — specific recommendation based on actual conditions".
Set title to "What should I wear?".`;
}

export function buildFoodPrompt(ctx: NormalizedContext): string {
  return `${SYSTEM_BASE(ctx)}

TASK: Suggest food and drink recommendations for today based on the environmental conditions at ${ctx.location.name}.
Consider feels-like temperature, humidity, rain probability, and time of day.
Provide 3 specific food/drink suggestions.
Set title to "What should I eat today?".`;
}

export function buildInsightPrompt(ctx: NormalizedContext): string {
  return `${SYSTEM_BASE(ctx)}

TASK: Generate weekly environmental insights for ${ctx.location.name} based on the 7-day daily forecast.

Provide exactly 4 insights in "whatToDo":
1. Rain pattern insight with specific hours or days
2. Best day of the week for outdoor activities (name the day, give specific reason with data)
3. Morning vs afternoon conditions comparison with actual percentages
4. Temperature trend across the week and which day is most disruptive

Set "bestTime" to the best day name (e.g. "Thursday").
Set title to "Weekly outlook".`;
}

export function buildAskAiPrompt(
  ctx: NormalizedContext,
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
): string {
  const historyNote =
    history.length > 0
      ? `\nCONVERSATION HISTORY (for context, do not repeat):
${history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}`
      : "";

  return `${SYSTEM_BASE(ctx)}${historyNote}

TASK: Answer this question from the user: "${question}"

Reason from the actual environmental data above. If the question involves a time or scenario change (e.g. "what if I move it to 4pm"), analyse the hourly data for that specific time window.
If the question is ambiguous, interpret it in the most useful way for planning the day.
Set "title" to the user's question (truncated to 60 chars if needed).`;
}

export function buildActionChipsPrompt(ctx: NormalizedContext, domain: string): string {
  return `You are a concise action suggestion engine for a weather app.
Based on this environmental data for ${ctx.location.name} on ${ctx.date}:
${JSON.stringify({
  current: ctx.current,
  todaySummary: {
    rainMax: Math.max(...ctx.todayHours.map((h) => h.rainProbability)),
    uvMax: Math.max(...ctx.todayHours.map((h) => h.uvIndex)),
    feelsLikeRange: [
      Math.min(...ctx.todayHours.map((h) => h.feelsLike)),
      Math.max(...ctx.todayHours.map((h) => h.feelsLike)),
    ],
  },
  sun: ctx.sun,
}, null, 2)}

Domain: "${domain}"

Return ONLY a JSON object: { "chips": ["action 1", "action 2", "action 3"] }
Each chip must be ≤8 words, start with a verb, be directly actionable given today's conditions.
Examples: "Exercise before 10am", "Book indoor backup for tonight", "Pack SPF — UV peaks at 7"`;
}
