export type YoutubeVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  views?: string;
};

type YoutubeApiItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails?: { medium?: { url: string } };
  };
};

type YoutubeDetailsItem = {
  id: string;
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
};

export function formatDuration(iso?: string): string | undefined {
  if (!iso) return undefined;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatViews(count?: string): string | undefined {
  if (!count) return undefined;
  const n = parseInt(count, 10);
  if (Number.isNaN(n)) return undefined;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K views`;
  return `${n} views`;
}

async function enrichWithDetails(videos: YoutubeVideo[]): Promise<YoutubeVideo[]> {
  if (videos.length === 0) return videos;
  const ids = videos.map((v) => v.id).join(",");
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.items) return videos;
    const detailsById = new Map<string, YoutubeDetailsItem>(
      (data.items as YoutubeDetailsItem[]).map((item) => [item.id, item])
    );
    return videos.map((v) => {
      const details = detailsById.get(v.id);
      return {
        ...v,
        duration: formatDuration(details?.contentDetails?.duration),
        views: formatViews(details?.statistics?.viewCount),
      };
    });
  } catch {
    return videos;
  }
}

export async function searchYoutube(query: string, maxResults = 3): Promise<YoutubeVideo[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&maxResults=${maxResults}&q=${encodeURIComponent(
    query
  )}&key=${process.env.YOUTUBE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.items) return [];

  const videos = (data.items as YoutubeApiItem[]).map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? "",
  }));

  return enrichWithDetails(videos);
}
