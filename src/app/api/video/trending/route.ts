import { createClient } from "@supabase/supabase-js";
import { searchYoutube } from "@/lib/youtube";

async function getCountryCode(lat?: number, lng?: number): Promise<string> {
  if (lat == null || lng == null) return "US";
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "User-Agent": "BillyOS/1.0" } }
    );
    const data = await res.json();
    return data.address?.country_code?.toUpperCase() || "US";
  } catch {
    return "US";
  }
}

async function fetchGeneralTrending(regionCode: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=${regionCode}&maxResults=20&key=${process.env.YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.items) return [];
  return data.items.map((item: { id: string; snippet: { title: string; channelTitle: string; thumbnails?: { medium?: { url: string } } } }) => ({
    id: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url,
  }));
}

export async function POST(req: Request) {
  const { lat, lng, topic } = await req.json();
  const authHeader = req.headers.get("Authorization");
  const regionCode = await getCountryCode(lat, lng);

  // A topic chip was clicked — search that topic specifically, no blending.
  if (topic) {
    const videos = await searchYoutube(topic, 24).catch(() => []);
    return Response.json({ videos });
  }

  // "All" selected — try to bias toward what the user has actually been watching recently.
  if (authHeader) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: history } = await supabase
          .from("watch_history")
          .select("query, title, created_at")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (history && history.length > 0) {
          const recentTopic = history[0].query || history[0].title;
          const [topicResults, generalResults] = await Promise.all([
            searchYoutube(recentTopic, 12).catch(() => []),
            fetchGeneralTrending(regionCode).catch(() => []),
          ]);
          const seen = new Set(topicResults.map((v: { id: string }) => v.id));
          const combined = [...topicResults, ...generalResults.filter((v: { id: string }) => !seen.has(v.id))];
          return Response.json({ videos: combined.slice(0, 24) });
        }
      }
    } catch {
      // fall through to plain trending on any error
    }
  }

  const videos = await fetchGeneralTrending(regionCode);
  return Response.json({ videos });
}
