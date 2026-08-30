import { createClient } from "@supabase/supabase-js";
import { searchYoutube } from "@/lib/youtube";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return Response.json({ recent: [], suggestions: [] });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return Response.json({ recent: [], suggestions: [] });

  const { data: history } = await supabase
    .from("watch_history")
    .select("video_id, title, channel, thumbnail, query, created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (!history || history.length === 0) {
    return Response.json({ recent: [], suggestions: [] });
  }

  const seen = new Set<string>();
  const recent = history.filter((h) => (seen.has(h.video_id) ? false : (seen.add(h.video_id), true))).slice(0, 8);

  const distinctQueries = [...new Set(history.map((h) => h.query).filter(Boolean))].slice(0, 2) as string[];
  const suggestionBatches = await Promise.all(
    distinctQueries.map((q) => searchYoutube(q, 6).catch(() => []))
  );
  const suggestions = suggestionBatches.flat().slice(0, 12);

  return Response.json({ recent, suggestions });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return Response.json({ ok: false });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return Response.json({ ok: false });

  const { videoId, title, channel, thumbnail, query } = await req.json();
  await supabase.from("watch_history").insert({
    user_id: userData.user.id,
    video_id: videoId,
    title,
    channel,
    thumbnail,
    query: query || null,
  });

  return Response.json({ ok: true });
}
