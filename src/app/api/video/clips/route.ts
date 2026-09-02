import { formatViews } from "@/lib/youtube";

type YoutubeApiItem = { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails?: { medium?: { url: string }; high?: { url: string } } } };

async function shortsSearch(query: string, maxResults: number) {
  const q = query ? query : "shorts";
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&videoDuration=short&maxResults=${maxResults}&q=${encodeURIComponent(
    q
  )}&key=${process.env.YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.items) return [];
  const clips = data.items.map((item: YoutubeApiItem) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
  }));
  return enrichViews(clips);
}

async function enrichViews(clips: { id: string; title: string; channel: string; thumbnail?: string }[]) {
  if (clips.length === 0) return clips;
  try {
    const ids = clips.map((c) => c.id).join(",");
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.items) return clips;
    const viewsById = new Map<string, string | undefined>(
      (data.items as { id: string; statistics?: { viewCount?: string } }[]).map((item) => [
        item.id,
        formatViews(item.statistics?.viewCount),
      ])
    );
    return clips.map((c) => ({ ...c, views: viewsById.get(c.id) }));
  } catch {
    return clips;
  }
}

export async function POST(req: Request) {
  const { topic } = await req.json();
  const clips = await shortsSearch(topic || "", 15);

  if (clips.length === 0) {
    return Response.json({ error: "Couldn't find any clips right now." }, { status: 502 });
  }

  return Response.json({ clips });
}
