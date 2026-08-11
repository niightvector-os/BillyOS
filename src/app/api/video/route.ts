import OpenAI from "openai";
import { checkAndIncrementUsage, usageBlockedResponse } from "@/lib/usage";
import { getErrorStatus } from "@/lib/errors";

type YoutubeApiItem = { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails?: { medium?: { url: string } } } };
type YoutubeVideoLike = { id: string };

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

async function youtubeSearch(query: string, maxResults: number) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&maxResults=${maxResults}&q=${encodeURIComponent(
    query
  )}&key=${process.env.YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.items) return [];
  return data.items.map((item: YoutubeApiItem) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url,
  }));
}

// Reject obviously broken AI rewrites (e.g. maths/garbage) rather than trusting them blindly
function looksSane(query: string, originalTopic: string) {
  if (!query || query.length < 2 || query.length > 100) return false;
  const mathy = /[=+*/^]{1,}|\d{4,}/.test(query);
  if (mathy) return false;
  return true;
}

async function getRefinedQuery(topic: string) {
  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "Turn the user's topic into the exact short keyword phrase someone would type into YouTube's search bar — 3-6 words, specific proper nouns/terms only, no filler. Reply with ONLY the search phrase, nothing else.",
          },
          { role: "user", content: topic },
        ],
        temperature: 0.2,
        max_tokens: 20,
      });
      const q = completion.choices[0]?.message?.content?.trim().replace(/["']/g, "");
      if (q && looksSane(q, topic)) return q;
      return null;
    } catch (err) {
      if (getErrorStatus(err) === 429 || getErrorStatus(err) === 503) continue;
      continue;
    }
  }
  return null;
}

function dedupe(videos: YoutubeVideoLike[]) {
  const seen = new Set();
  return videos.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
}

export async function POST(req: Request) {
  const usage = await checkAndIncrementUsage(req.headers.get("Authorization"));
  if (usage.blocked) return usageBlockedResponse();

  const { topic } = await req.json();

  // Primary, reliable: search the raw topic directly — never depends on AI succeeding
  const primaryResults = await youtubeSearch(topic, 5);

  // Bonus, best-effort: an AI-refined query, only used if it passes a sanity check
  const refined = await getRefinedQuery(topic);
  const bonusResults = refined ? await youtubeSearch(refined, 3) : [];

  const videos = dedupe([...primaryResults, ...bonusResults]).slice(0, 5);

  if (videos.length === 0) {
    return Response.json({ error: "Couldn't find a video for that right now." }, { status: 502 });
  }

  return Response.json({ topic, query: refined || topic, videos });
}
