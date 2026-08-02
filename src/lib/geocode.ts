import OpenAI from "openai";
import { fetchAllRoutes, RouteResult } from "@/lib/route";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

const LOCATIONS_SYSTEM = `Given a topic, identify up to 4 real-world places relevant to it.
Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"locations": [{"name": "short display name", "search_query": "specific geocodable search string, e.g. 'Colosseum, Rome, Italy'", "description": "one sentence on why it's relevant"}]}
If there's no clear real-world location, return {"locations": []}.
Use clear English (UK spelling).`;

const ROUTE_SYSTEM = `Decide if this question is specifically asking for the distance, route, or travel time between exactly two named real-world places (e.g. "distance from England to France", "how far is London from Paris", "route from my hotel to the airport").
Respond with ONLY valid JSON, no markdown fences, no commentary:
{"isRoute": true or false, "origin": "specific geocodable place name, e.g. 'London, UK'", "destination": "specific geocodable place name, e.g. 'Paris, France'"}
If it's not a two-place distance/route question, return {"isRoute": false, "origin": "", "destination": ""}.`;

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function geocode(query: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": "BillyOS/0.1 (personal project)" } }
  );
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export async function getLocations(topic: string, limit = 4) {
  let parsed: { locations: { name: string; search_query: string; description: string }[] } | null = null;

  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: LOCATIONS_SYSTEM },
          { role: "user", content: topic },
        ],
        temperature: 0.3,
      });
      parsed = extractJson(completion.choices[0]?.message?.content || "");
      break;
    } catch (err: any) {
      if (err?.status === 429 || err?.status === 503) continue;
      continue;
    }
  }

  if (!parsed || parsed.locations.length === 0) return [];

  const results = [];
  for (const loc of parsed.locations.slice(0, limit)) {
    const coords = await geocode(loc.search_query);
    if (coords) results.push({ ...loc, ...coords });
    await new Promise((r) => setTimeout(r, 1000));
  }
  return results;
}

export type RouteQueryResult = {
  origin: { name: string; description: string; lat: number; lng: number };
  destination: { name: string; description: string; lat: number; lng: number };
  routes: RouteResult;
} | null;

// Detects "distance from X to Y" style questions specifically — separate from getLocations
// so normal map requests (no distance intent) never trigger a route line.
export async function getRouteIfRequested(topic: string): Promise<RouteQueryResult> {
  let parsed: { isRoute: boolean; origin: string; destination: string } | null = null;

  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: ROUTE_SYSTEM },
          { role: "user", content: topic },
        ],
        temperature: 0.2,
      });
      parsed = extractJson(completion.choices[0]?.message?.content || "");
      break;
    } catch (err: any) {
      if (err?.status === 429 || err?.status === 503) continue;
      continue;
    }
  }

  if (!parsed || !parsed.isRoute || !parsed.origin || !parsed.destination) return null;

  const [originCoords, destCoords] = await Promise.all([geocode(parsed.origin), geocode(parsed.destination)]);
  if (!originCoords || !destCoords) return null;

  const routes = await fetchAllRoutes(originCoords, destCoords);

  return {
    origin: { name: parsed.origin, description: "Origin", ...originCoords },
    destination: { name: parsed.destination, description: "Destination", ...destCoords },
    routes,
  };
}
