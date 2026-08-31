export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query || query.length < 2) return Response.json({ suggestions: [] });

  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`
    );
    const text = await res.text();
    // Response is JSONP-ish: window.google.ac.h([...]) — extract the array
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return Response.json({ suggestions: [] });
    const parsed = JSON.parse(match[0]);
    const suggestions = (parsed[1] || []).map((item: unknown[]) => item[0]).slice(0, 8);
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}
