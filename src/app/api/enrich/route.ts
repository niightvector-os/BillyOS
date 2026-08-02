import OpenAI from "openai";
import { getLocations } from "@/lib/geocode";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

const CLASSIFY_SYSTEM = `Given a user's message, decide what would help illustrate the answer.
Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"needs_images": boolean, "image_query": "short search phrase or empty string", "needs_map": boolean, "map_query": "short phrase describing what real-world locations to find, or empty string"}
Set needs_images true only if a photo would meaningfully help (a person, place, object, artwork, structure, event, everyday concept).
Set needs_map true only if real-world geographic locations are clearly relevant (historical events, geography, travel, battles, cities).
Only set both true if the topic genuinely spans both. If neither clearly applies, both should be false.`;

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function classify(message: string) {
  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: CLASSIFY_SYSTEM },
          { role: "user", content: message },
        ],
        temperature: 0.2,
      });
      return extractJson(completion.choices[0]?.message?.content || "");
    } catch (err: any) {
      if (err?.status === 429 || err?.status === 503) continue;
      continue;
    }
  }
  return null;
}

async function fetchWikipediaImages(query: string) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrlimit=4&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=500&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "BillyOS/0.1 (personal project)" } });
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .filter((p: any) => p.thumbnail)
    .map((p: any) => ({ title: p.title, url: p.thumbnail.source, pageUrl: p.fullurl }))
    .slice(0, 4);
}

export async function POST(req: Request) {
  const { message } = await req.json();
  const classification = await classify(message);

  if (!classification) return Response.json({ images: [], mapLocations: [] });

  const [images, mapLocations] = await Promise.all([
    classification.needs_images && classification.image_query
      ? fetchWikipediaImages(classification.image_query)
      : Promise.resolve([]),
    classification.needs_map && classification.map_query
      ? getLocations(classification.map_query, 4)
      : Promise.resolve([]),
  ]);

  return Response.json({ images, mapLocations });
}
