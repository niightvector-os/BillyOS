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

export async function POST(req: Request) {
  const { lat, lng } = await req.json();
  const regionCode = await getCountryCode(lat, lng);

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=${regionCode}&maxResults=16&key=${process.env.YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.items) return Response.json({ videos: [] });

  const videos = data.items.map((item: { id: string; snippet: { title: string; channelTitle: string; thumbnails?: { medium?: { url: string } } } }) => ({
    id: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url,
  }));

  return Response.json({ videos });
}
