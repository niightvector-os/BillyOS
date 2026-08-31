import { checkAndIncrementUsage, usageBlockedResponse } from "@/lib/usage";
import { createChatCompletion } from "@/lib/ai-providers";

type YoutubeApiItem = { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails?: { medium?: { url: string } } } };
type YoutubeVideoLike = { id: string };

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
  const raw = await createChatCompletion(
    "Turn the user's topic into the exact short keyword phrase someone would type into YouTube's search bar — 3-6 words, specific proper nouns/terms only, no filler. Reply with ONLY the search phrase, nothing else.",
    topic,
    0.2
  );
  if (!raw) return null;
  const q = raw.trim().replace(/["']/g, "");
  if (q && looksSane(q, topic)) return q;
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
  const primaryResults = await youtubeSearch(topic, 16);

  // Bonus, best-effort: an AI-refined query, only used if it passes a sanity check
  const refined = await getRefinedQuery(topic);
  const bonusResults = refined ? await youtubeSearch(refined, 8) : [];

  const videos = dedupe([...primaryResults, ...bonusResults]).slice(0, 20);

  if (videos.length === 0) {
    return Response.json({ error: "Couldn't find a video for that right now." }, { status: 502 });
  }

  return Response.json({ topic, query: refined || topic, videos });
}
