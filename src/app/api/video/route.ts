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

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Best-effort: an AI-refined query plus a second search using it. Never allowed
// to hold up the response — if it's not back within the time budget, we ship
// without it. The primary raw-topic search never depends on this succeeding.
async function getBonusResults(topic: string): Promise<{ refined: string | null; results: YoutubeVideoLike[] }> {
  const refined = await getRefinedQuery(topic);
  if (!refined) return { refined: null, results: [] };
  const results = await youtubeSearch(refined, 12);
  return { refined, results };
}

export async function POST(req: Request) {
  const usage = await checkAndIncrementUsage(req.headers.get("Authorization"));
  if (usage.blocked) return usageBlockedResponse();

  const { topic } = await req.json();

  const [primaryResults, bonus] = await Promise.all([
    youtubeSearch(topic, 20),
    withTimeout(getBonusResults(topic), 4000, { refined: null, results: [] }),
  ]);

  const videos = dedupe([...primaryResults, ...bonus.results]).slice(0, 30);

  if (videos.length === 0) {
    return Response.json({ error: "Couldn't find a video for that right now." }, { status: 502 });
  }

  return Response.json({ topic, query: bonus.refined || topic, videos });
}
